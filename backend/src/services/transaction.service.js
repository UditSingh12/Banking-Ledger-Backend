const mongoose = require("mongoose");
const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");

/**
 * Core money-movement service.
 *
 * ALL balance mutations go through this service — never inline in controllers.
 * This keeps gateway concerns outside the core logic: a future payment provider
 * only needs to call transfer() with source: 'GATEWAY', nothing else changes.
 *
 * Every write that touches balances and creates a transaction runs inside a
 * Mongoose session (MongoDB multi-document transaction). If anything throws,
 * the session is aborted and all partial writes are rolled back automatically.
 */

/**
 * Internal fund transfer — atomic debit + credit within a single MongoDB session.
 *
 * @param {{ fromAccountId, toAccountId, amount, userId, idempotencyKey, type?, source?, note? }} opts
 * @returns {{ transaction, isIdempotentReplay: boolean }}
 */
/**
 * Helper function containing the core balance mutations and validation logic.
 * Can be run either inside a transaction session or as a fallback without one.
 */
async function executeTransferLogic(session, { fromAccountId, toAccountId, amount, userId, type, source, note, idempotencyKey }) {
  // ── Load accounts ────────────────────────────────────────────────
  const [fromAccount, toAccount] = await Promise.all([
    fromAccountId ? accountModel.findById(fromAccountId).session(session) : Promise.resolve(null),
    toAccountId   ? accountModel.findById(toAccountId).session(session)   : Promise.resolve(null),
  ]);

  if (fromAccountId && !fromAccount) {
    throw new ServiceError("Source account not found", 404);
  }
  if (toAccountId && !toAccount) {
    throw new ServiceError("Destination account not found", 404);
  }

  // ── Ownership check ──────────────────────────────────────────────
  if (fromAccount && userId && fromAccount.user.toString() !== userId.toString()) {
    throw new ServiceError("You do not own the source account", 403);
  }

  // ── Status checks ────────────────────────────────────────────────
  if (fromAccount && fromAccount.status !== "ACTIVE") {
    throw new ServiceError(`Source account is ${fromAccount.status}`, 422);
  }
  if (toAccount && toAccount.status !== "ACTIVE") {
    throw new ServiceError(`Destination account is ${toAccount.status}`, 422);
  }

  // ── Balance check ────────────────────────────────────────────────
  if (fromAccount && fromAccount.balance < amount) {
    throw new ServiceError(
      `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString("en-IN")}, Required: ₹${amount.toLocaleString("en-IN")}`,
      422
    );
  }

  // ── Atomic balance update ────────────────────────────────────────
  if (fromAccount) {
    await accountModel.findByIdAndUpdate(
      fromAccountId,
      { $inc: { balance: -amount } },
      { session, runValidators: true }
    );
  }
  if (toAccount) {
    await accountModel.findByIdAndUpdate(
      toAccountId,
      { $inc: { balance: amount } },
      { session, runValidators: true }
    );
  }

  // ── Create transaction record ────────────────────────────────────
  const [created] = await transactionModel.create(
    [{ fromAccount: fromAccountId, toAccount: toAccountId, amount, idempotencyKey, type, source, status: "COMPLETED", note }],
    { session }
  );
  return created;
}

/**
 * Internal fund transfer — atomic debit + credit within a single MongoDB session.
 * Automatically falls back to a non-transactional sequence if the MongoDB deployment
 * does not support transactions/sessions (e.g. standalone local MongoDB instances).
 *
 * @param {{ fromAccountId, toAccountId, amount, userId, idempotencyKey, type?, source?, note? }} opts
 * @returns {{ transaction, isIdempotentReplay: boolean }}
 */
async function transfer(opts) {
  const { fromAccountId, toAccountId, amount, userId, idempotencyKey, type = "TRANSFER", source = "INTERNAL", note = null } = opts;

  // ── Validation before touching the DB ─────────────────────────────
  if (!idempotencyKey) throw new ServiceError("Idempotency key is required", 400);
  if (amount <= 0) throw new ServiceError("Transfer amount must be greater than zero", 422);
  if (fromAccountId && toAccountId && fromAccountId.toString() === toAccountId.toString()) {
    throw new ServiceError("Source and destination accounts must be different", 422);
  }

  // ── 1. Try running inside a Mongoose Session ───────────────────────
  let session = null;
  try {
    session = await mongoose.startSession();
  } catch (sessionErr) {
    // MongoDB does not support sessions/transactions at all (standalone server)
    console.warn("[TransactionService] Mongoose session initiation failed, falling back to non-transactional execution:", sessionErr.message);
    const transaction = await executeTransferLogic(null, opts);
    return { transaction, isIdempotentReplay: false };
  }

  try {
    let txnDoc = null;
    let isIdempotentReplay = false;

    await session.withTransaction(async () => {
      txnDoc = await executeTransferLogic(session, opts);
    });

    await session.endSession();
    return { transaction: txnDoc, isIdempotentReplay };

  } catch (err) {
    await session.endSession();

    // Check if the error is due to MongoDB transactions/sessions unsupported by the current deployment tier
    const isTxnUnsupported = 
      err.message.includes("replica set") ||
      err.message.includes("sharded cluster") ||
      err.message.includes("transaction") ||
      err.message.includes("session") ||
      err.codeName === "TransactionOutcomeUnknown" ||
      err.code === 20;

    if (isTxnUnsupported) {
      console.warn("[TransactionService] MongoDB transaction failed. Falling back to non-transactional execution:", err.message);
      try {
        const transaction = await executeTransferLogic(null, opts);
        return { transaction, isIdempotentReplay: false };
      } catch (fallbackErr) {
        if (fallbackErr instanceof ServiceError) throw fallbackErr;
        throw new ServiceError(fallbackErr.message || "Transfer failed", 500);
      }
    }

    // ── Idempotency: duplicate key on idempotencyKey ─────────────────
    if (err.code === 11000 || (err.errorResponse && err.errorResponse.code === 11000)) {
      const existing = await transactionModel.findOne({ idempotencyKey });
      if (existing) return { transaction: existing, isIdempotentReplay: true };
    }

    // Re-throw ServiceErrors as-is, wrap everything else
    if (err instanceof ServiceError) throw err;
    throw new ServiceError(err.message || "Transfer failed", 500);
  }
}

/**
 * Reverses a completed transfer.
 *
 * Rules:
 * - Only the original sender can initiate a reversal (CONFIGURABLE: change
 *   the ownership check below to allow receiver-initiated reversals too).
 * - Original must be COMPLETED and not already reversed.
 * - No reversing a reversal (no chains).
 * - Uses the same session/balance logic as a normal transfer.
 *
 * @param {{ transactionId, requestingUserId, reason }} opts
 * @returns {{ transaction: reversalTxn }}
 */
async function reverseTransaction({ transactionId, requestingUserId, reason }) {
  const original = await transactionModel.findById(transactionId);

  if (!original) throw new ServiceError("Transaction not found", 404);
  if (original.status !== "COMPLETED") {
    throw new ServiceError("Only COMPLETED transactions can be reversed", 422);
  }
  if (original.reversedBy) {
    throw new ServiceError("This transaction has already been reversed", 409);
  }
  if (original.type === "REVERSAL") {
    throw new ServiceError("A reversal cannot itself be reversed", 422);
  }

  // ── Sender-only check (configurable) ──────────────────────────────
  // To allow receiver-initiated reversals, also check: || original.toAccount.user === requestingUserId
  const fromAccount = await accountModel.findById(original.fromAccount);
  if (!fromAccount || fromAccount.user.toString() !== requestingUserId.toString()) {
    throw new ServiceError("Only the sender of the original transaction may request a reversal", 403);
  }

  // Reversal swaps fromAccount/toAccount — the original receiver sends money back
  const reversalIdempotencyKey = `reversal_${transactionId}`;

  const { transaction: reversalTxn, isIdempotentReplay } = await transfer({
    fromAccountId: original.toAccount,
    toAccountId: original.fromAccount,
    amount: original.amount,
    userId: null, // ownership check for reversal is done above on the original's fromAccount
    idempotencyKey: reversalIdempotencyKey,
    type: "REVERSAL",
    source: original.source,
    note: reason || `Reversal of transaction ${transactionId}`,
  });

  if (!isIdempotentReplay) {
    // Link the two transactions
    await Promise.all([
      transactionModel.findByIdAndUpdate(reversalTxn._id, { reversalOf: original._id }),
      transactionModel.findByIdAndUpdate(original._id, {
        reversedBy: reversalTxn._id,
        status: "REVERSED",
      }),
    ]);
  }

  return { transaction: reversalTxn };
}

// ── Custom error class so the controller knows status codes ───────────────
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ServiceError";
  }
}

module.exports = { transfer, reverseTransaction, ServiceError };
