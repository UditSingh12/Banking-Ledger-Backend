const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controllers");
const {
  validate,
  createAccountSchema,
  accountStatusSchema,
  transactionQuerySchema,
} = require("../middlewares/validators");

const router = express.Router();

// All account routes require authentication
router.use(authMiddleware);

/**
 * GET /api/account
 * Returns all accounts for the authenticated user (sorted newest-first)
 */
router.get("/", accountController.listAccounts);

/**
 * POST /api/account
 * Creates a new SAVINGS or CURRENT account.
 * 409 if user already has that account type.
 */
router.post("/", validate(createAccountSchema), accountController.createAccount);

/**
 * PATCH /api/account/:id/status
 * Changes account status (ACTIVE / FROZEN / CLOSED).
 * Business rules enforced: can't close with balance or pending transactions.
 */
router.patch("/:id/status", validate(accountStatusSchema), accountController.updateAccountStatus);

/**
 * GET /api/account/:id/transactions
 * Paginated + filtered transaction history for an account the user owns.
 * Query params: page, limit, status, type, direction (incoming|outgoing), startDate, endDate
 */
router.get("/:id/transactions", validate(transactionQuerySchema, "query"), accountController.getTransactionHistory);

module.exports = router;