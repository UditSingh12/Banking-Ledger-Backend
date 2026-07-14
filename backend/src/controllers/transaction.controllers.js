const transactionService = require("../services/transaction.service");
const auditService = require("../services/audit.service");

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

module.exports = { initiateTransfer, reverseTransaction };
