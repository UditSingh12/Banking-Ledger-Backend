const transactionService = require("../services/transaction.service");
const auditService = require("../services/audit.service");
const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const disputeModel = require("../models/dispute.model");

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

/**
 * POST /api/transaction/transfer
 * Initiates a fund transfer between two accounts.
 * Returns 201 on a new transfer, 200 on an idempotent replay.
 */
async function initiateTransfer(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  try {
    const { transaction, isIdempotentReplay } = await transactionService.transfer({
      fromAccountId: fromAccount,
      toAccountId: toAccount,
      amount,
      userId: req.user._id,
      idempotencyKey,
      type: "TRANSFER",
      source: "INTERNAL",
    });

    if (!isIdempotentReplay) {
      auditService.log({
        userId: req.user._id,
        action: "TRANSFER",
        targetId: transaction._id,
        targetType: "Transaction",
        ip: getClientIP(req),
        metadata: { fromAccount, toAccount, amount },
      });
    }

    return res.status(isIdempotentReplay ? 200 : 201).json({
      transaction,
      idempotentReplay: isIdempotentReplay,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ message: err.message, status: "Failed" });
  }
}

/**
 * POST /api/transaction/:id/reverse
 * Reverses a completed transfer.
 */
async function reverseTransaction(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const { transaction } = await transactionService.reverseTransaction({
      transactionId: id,
      requestingUserId: req.user._id,
      reason,
    });

    auditService.log({
      userId: req.user._id,
      action: "REVERSAL",
      targetId: transaction._id,
      targetType: "Transaction",
      ip: getClientIP(req),
      metadata: { originalTransactionId: id, reason },
    });

    return res.status(201).json({ transaction });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ message: err.message, status: "Failed" });
  }
}

/**
 * POST /api/transaction/:id/dispute
 * Raises a dispute on a COMPLETED transaction.
 * - Changes transaction status to DISPUTED
 * - Creates a Dispute document
 * - The disputing user must be the sender or receiver
 */
async function raiseDispute(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const transaction = await transactionModel.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found", status: "Failed" });
    }

    if (transaction.status !== "COMPLETED") {
      return res.status(422).json({
        message: `Only COMPLETED transactions can be disputed. Current status: ${transaction.status}`,
        status: "Failed",
      });
    }

    // Check the user is involved in this transaction (sender or receiver's account owner)
    const [fromAcc, toAcc] = await Promise.all([
      transaction.fromAccount ? accountModel.findById(transaction.fromAccount) : null,
      transaction.toAccount   ? accountModel.findById(transaction.toAccount)   : null,
    ]);

    const userId = req.user._id.toString();
    const isInvolved =
      (fromAcc && fromAcc.user.toString() === userId) ||
      (toAcc   && toAcc.user.toString()   === userId);

    if (!isInvolved) {
      return res.status(403).json({
        message: "You are not a party to this transaction",
        status: "Failed",
      });
    }

    // Check no existing open dispute for this transaction
    const existingDispute = await disputeModel.findOne({ transaction: id });
    if (existingDispute) {
      return res.status(409).json({
        message: `A dispute already exists for this transaction (status: ${existingDispute.status})`,
        status: "Conflict",
      });
    }

    // Atomically update transaction status and create dispute
    const [dispute] = await Promise.all([
      disputeModel.create({ transaction: id, raisedBy: req.user._id, reason }),
      transactionModel.findByIdAndUpdate(id, { status: "DISPUTED" }),
    ]);

    auditService.log({
      userId: req.user._id,
      action: "DISPUTE_RAISED",
      targetId: dispute._id,
      targetType: "Dispute",
      ip: getClientIP(req),
      metadata: { transactionId: id, reason },
    });

    return res.status(201).json({ dispute, message: "Dispute raised successfully. Our team will review it shortly." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to raise dispute. Please try again.", status: "Failed" });
  }
}

module.exports = { initiateTransfer, reverseTransaction, raiseDispute };
