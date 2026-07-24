const express = require("express");
const { authMiddleware, requireRole } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controllers");
const {
  validate,
  adminFlagSchema,
  adminDisputeResolveSchema,
} = require("../middlewares/validators");

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authMiddleware, requireRole("ADMIN"));

/**
 * GET /api/admin/users
 * List all users (paginated). Never returns sensitive fields.
 * Query: { page?, limit? }
 */
router.get("/users", adminController.listUsers);

/**
 * POST /api/admin/users/:id/unlock
 * Reset failed login attempts + clear lockout for a user.
 */
router.post("/users/:id/unlock", adminController.unlockUser);

/**
 * GET /api/admin/transactions
 * List all transactions across all users (paginated + filtered).
 * Query: { page?, limit?, status?, type?, startDate?, endDate? }
 */
router.get("/transactions", adminController.listTransactions);

/**
 * POST /api/admin/accounts/:id/flag
 * Set or clear riskFlag on an account.
 * Body: { riskFlag: boolean, riskReason?: string }
 */
router.post("/accounts/:id/flag", validate(adminFlagSchema), adminController.flagAccount);

/**
 * GET /api/admin/disputes
 * List all disputes (paginated + filtered by status).
 * Query: { page?, limit?, status? }
 */
router.get("/disputes", adminController.listDisputes);

/**
 * POST /api/admin/disputes/:id/resolve
 * Resolve or reject a dispute.
 * Body: { status: 'RESOLVED'|'REJECTED', resolution: string }
 */
router.post("/disputes/:id/resolve", validate(adminDisputeResolveSchema), adminController.resolveDispute);

module.exports = router;
