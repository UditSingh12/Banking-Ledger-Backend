const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controllers");
const { validate, transferSchema, reversalSchema, disputeSchema } = require("../middlewares/validators");

const router = express.Router();

router.use(authMiddleware);

/**
 * POST /api/transaction/transfer
 * Initiates a fund transfer. Returns 201 on new transfer, 200 on idempotent replay.
 * Body: { fromAccount, toAccount, amount, idempotencyKey, totpCode? }
 */
router.post("/transfer", validate(transferSchema), transactionController.initiateTransfer);

/**
 * POST /api/transaction/:id/reverse
 * Reverses a COMPLETED transaction (sender only).
 * Body: { reason? }
 */
router.post("/:id/reverse", validate(reversalSchema), transactionController.reverseTransaction);

/**
 * POST /api/transaction/:id/dispute
 * Raises a dispute on a COMPLETED transaction.
 * Sets the transaction status to DISPUTED and creates a Dispute document.
 * Body: { reason }
 */
router.post("/:id/dispute", validate(disputeSchema), transactionController.raiseDispute);

module.exports = router;
