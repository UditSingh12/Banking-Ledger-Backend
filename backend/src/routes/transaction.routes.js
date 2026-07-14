const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controllers");
const { validate, transferSchema, reversalSchema } = require("../middlewares/validators");

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

/**
 * POST /api/transaction/transfer
 * Initiates a fund transfer.
 * Returns 201 on new transfer, 200 on idempotent replay (same key, same result).
 *
 * Body: { fromAccount, toAccount, amount, idempotencyKey }
 */
router.post("/transfer", validate(transferSchema), transactionController.initiateTransfer);

/**
 * POST /api/transaction/:id/reverse
 * Reverses a COMPLETED transaction.
 * Sender-only by default (configurable in transaction.service.js).
 * Cannot reverse a REVERSAL. Cannot reverse an already-reversed transaction.
 *
 * Body: { reason? }
 */
router.post("/:id/reverse", validate(reversalSchema), transactionController.reverseTransaction);

module.exports = router;
