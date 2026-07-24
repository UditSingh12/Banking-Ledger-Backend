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
 * SAFETY RULES:
 * 1. Every write that touches balances runs inside a Mongoose session
 *    (MongoDB multi-document transaction). If anything throws, the session
 *    is aborted and all partial writes are rolled back automatically.
 *    There is NO non-transactional fallback — if transactions aren't supported,
 *    the error bubbles to the client. Use a replica set (see docker-compose.yml).
 *
 * 2. Balance debit uses an atomic conditional $inc with a minimum-balance filter.
 *    This prevents race conditions: two concurrent transfers can't both pass a
 *    balance check and then both decrement — only one will find the filter
 *    matching and the other will receive a ServiceError(422).
 *
 * 3. TransientTransactionError / UnknownTransactionCommitResult are retried
 *    with exponential backoff (up to 3 attempts).
 */

// ── Custom error class so the controller knows the HTTP status code ────────
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ServiceError";
  }
}

// ── Exponential backoff retry wrapper for withTransaction() ───────────────
/**
 * Wraps session.withTransaction(fn) with automatic retry on transient errors.
 * MongoDB driver signals retryable errors with errorLabels.
 *
 * @param {import('mongoose').ClientSession} session
 * @param {() => Promise<any>} fn
 * @param {number} [maxAttempts=3]
 */
async function withRetry(session, fn, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await session.withTransaction(fn);
    } catch (err) {
      const labels = err.errorLabels ?? [];
      const isTransient = labels.includes("TransientTransactionError");
      const isUnknownCommit = labels.includes("UnknownTransactionCommitResult");

      if ((isTransient || isUnknownCommit) && attempt < maxAttempts - 1) {
        const delayMs = Math.pow(2, attempt) * 50; // 50ms, 100ms, 200ms…
        console.warn(
          `[TransactionService] Retryable error on attempt ${attempt + 1}/${maxAttempts} ` +
          `(${err.errorLabels?.join(", ") ?? err.message}). Retrying in ${delayMs}ms…`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      // Non-retryable or out of attempts — re-throw
      throw err;
    }
  }
}

// ── Velocity / risk checks (runs BEFORE the session opens) ────────────────
/**
 * Checks single-transfer limit, daily limit, and new-recipient risk flag.
 * Modifies fromAccount's riskFlag in-place if a new-recipient threshold is hit.
 * Throws ServiceError if hard limits are exceeded.
 */
async function runRiskChecks(fromAccount, toAccountId, amount, session) {
  // 1. Single-transfer limit
  const singleLimit = fromAccount.singleTransferLimit ?? 25000;
  if (amount > singleLimit) {
    throw new ServiceError(
      `Amount ₹${amount.toLocaleString("en-IN")} exceeds the single-transfer limit of ₹${singleLimit.toLocaleString("en-IN")}`,
      422
    );
  }

  // 2. Daily transfer limit — sum of today's COMPLETED outgoing transfers
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayAggregate] = await transactionModel.aggregate([
    {
      $match: {
        fromAccount: fromAccount._id,
        status: "COMPLETED",
        createdAt: { $gte: startOfDay },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);

  const todayTotal = todayAggregate?.total ?? 0;
  const dailyLimit = fromAccount.dailyTransferLimit ?? 100000;

  if (todayTotal + amount > dailyLimit) {
    throw new ServiceError(
      `Daily transfer limit of ₹${dailyLimit.toLocaleString("en-IN")} would be exceeded. ` +
      `Already transferred: ₹${todayTotal.toLocaleString("en-IN")}`,
      422
    );
  }

  // 3. New-recipient risk flag — first time sending to this toAccountId above ₹10,000
  if (amount > 10000) {
    const previousTransfer = await transactionModel.findOne({
      fromAccount: fromAccount._id,
      toAccount: toAccountId,
      status: "COMPLETED",
    }).session(session);

    if (!previousTransfer) {
      // Flag the account (fire-and-forget inside the session — doesn't block the transfer)
      await accountModel.findByIdAndUpdate(
        fromAccount._id,
        {
          riskFlag: true,
          riskReason: `First transfer to new recipient ···${toAccountId.toString().slice(-8).toUpperCase()} above ₹10,000`,
        },
        { session }
      );
      console.info(
        `[RiskEngine] Flagged account ${fromAccount._id} — first transfer to new recipient above ₹10,000`
      );
    }
  }
}

// ── Core transfer logic (runs inside the session) ─────────────────────────
/**
 * Executes the actual balance mutations and creates the transaction document.
 * Runs strictly inside a MongoDB session — no standalone fallback.
 */
async function executeTransferLogic(session, { fromAccountId, toAccountId, amount, userId, type, source, note, idempotencyKey }) {
  // ── Load accounts ────────────────────────────────────────────────
  const [fromAccount, toAccount] = await Promise.all([
    fromAccountId ? accountModel.findById(fromAccountId).session(session) : Promise.resolve(null),
    toAccountId   ? accountModel.findById(toAccountId).session(session)   : Promise.resolve(null),
  ]);

  if (fromAccountId && !fromAccount) throw new ServiceError("Source account not found", 404);
  if (toAccountId && !toAccount)     throw new ServiceError("Destination account not found", 404);

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

  // ── Risk / velocity checks (only for actual transfers, not reversals) ─
  if (fromAccount && toAccountId && type !== "REVERSAL") {
    await runRiskChecks(fromAccount, toAccountId, amount, session);
  }

  // ── Atomic debit — conditional on sufficient balance ──────────────
  // Uses findOneAndUpdate with a balance filter. If no document is returned,
  // the balance check failed atomically — no separate read-then-write race.
  if (fromAccount) {
    const debited = await accountModel.findOneAndUpdate(
      { _id: fromAccountId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session, new: true, runValidators: true }
    );

    if (!debited) {
      throw new ServiceError(
        `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString("en-IN")}, Required: ₹${amount.toLocaleString("en-IN")}`,
        422
      );
    }
  }

  // ── Unconditional credit ─────────────────────────────────────────
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
 * Fails loudly if the MongoDB deployment doesn't support transactions.
 *
 * @param {{ fromAccountId, toAccountId, amount, userId, idempotencyKey, type?, source?, note?, totpCode? }} opts
 * @returns {{ transaction, isIdempotentReplay: boolean }}
 */
async function transfer(opts) {
  const {
    fromAccountId,
    toAccountId,
    amount,
    userId,
    idempotencyKey,
    type = "TRANSFER",
    source = "INTERNAL",
    note = null,
  } = opts;

  // ── Pre-session validation ─────────────────────────────────────────────
  if (!idempotencyKey) throw new ServiceError("Idempotency key is required", 400);
  if (amount <= 0)     throw new ServiceError("Transfer amount must be greater than zero", 422);
  if (fromAccountId && toAccountId && fromAccountId.toString() === toAccountId.toString()) {
    throw new ServiceError("Source and destination accounts must be different", 422);
  }

  const session = await mongoose.startSession();

  try {
    let txnDoc = null;
    let isIdempotentReplay = false;

    await withRetry(session, async () => {
      txnDoc = await executeTransferLogic(session, opts);
    });

    return { transaction: txnDoc, isIdempotentReplay };

  } catch (err) {
    // ── Idempotency: duplicate key on idempotencyKey ─────────────────
    if (err.code === 11000 || (err.errorResponse && err.errorResponse.code === 11000)) {
      const existing = await transactionModel.findOne({ idempotencyKey });
      if (existing) return { transaction: existing, isIdempotentReplay: true };
    }

    // Re-throw ServiceErrors as-is, wrap unknown errors
    if (err instanceof ServiceError) throw err;

    // Translate MongoDB transaction errors into a clear service error
    const isInfraError =
      err.message.includes("replica set") ||
      err.message.includes("sharded cluster") ||
      err.message.includes("transaction") ||
      err.codeName === "TransactionOutcomeUnknown";

    if (isInfraError) {
      throw new ServiceError(
        "Transaction infrastructure error. Please contact support. (MongoDB replica set required)",
        503
      );
    }

    throw new ServiceError(err.message || "Transfer failed", 500);

  } finally {
    await session.endSession();
  }
}

/**
 * Reverses a completed transfer.
 * Rules:
 *  - Only the original sender can initiate a reversal.
 *  - Original must be COMPLETED and not already reversed.
 *  - No reversing a reversal (no chains).
 */
async function reverseTransaction({ transactionId, requestingUserId, reason }) {
  const original = await transactionModel.findById(transactionId);

  if (!original)                   throw new ServiceError("Transaction not found", 404);
  if (original.status !== "COMPLETED") {
    throw new ServiceError("Only COMPLETED transactions can be reversed", 422);
  }
  if (original.reversedBy)         throw new ServiceError("This transaction has already been reversed", 409);
  if (original.type === "REVERSAL") throw new ServiceError("A reversal cannot itself be reversed", 422);

  // Sender-only check
  const fromAccount = await accountModel.findById(original.fromAccount);
  if (!fromAccount || fromAccount.user.toString() !== requestingUserId.toString()) {
    throw new ServiceError("Only the sender of the original transaction may request a reversal", 403);
  }

  const reversalIdempotencyKey = `reversal_${transactionId}`;

  const { transaction: reversalTxn, isIdempotentReplay } = await transfer({
    fromAccountId: original.toAccount,
    toAccountId: original.fromAccount,
    amount: original.amount,
    userId: null, // ownership check is done above
    idempotencyKey: reversalIdempotencyKey,
    type: "REVERSAL",
    source: original.source,
    note: reason || `Reversal of transaction ${transactionId}`,
  });

  if (!isIdempotentReplay) {
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

module.exports = { transfer, reverseTransaction, ServiceError };
