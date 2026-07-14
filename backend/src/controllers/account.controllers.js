const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const transactionService = require("../services/transaction.service");
const auditService = require("../services/audit.service");

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

/**
 * POST /api/account
 * Creates a new SAVINGS or CURRENT account for the authenticated user.
 * Handles duplicate account type with a clean 409, not a raw Mongo error.
 */
async function createAccount(req, res) {
  const { accountType, currency = "INR" } = req.body;

  try {
    const initialBalance = accountType === "SAVINGS" ? 50000 : 10;

    const account = await accountModel.create({
      user: req.user._id,
      accountType,
      currency,
      balance: initialBalance,
    });

    auditService.log({
      userId: req.user._id,
      action: "ACCOUNT_CREATED",
      targetId: account._id,
      targetType: "Account",
      ip: getClientIP(req),
      metadata: { accountType, currency },
    });

    return res.status(201).json({ account });
  } catch (error) {
    // Duplicate key on the { user, accountType } compound unique index
    if (error.code === 11000) {
      return res.status(409).json({
        message: `You already have a ${accountType} account.`,
        status: "Conflict",
      });
    }
    return res.status(500).json({ message: "Failed to create account. Please try again.", status: "Failed" });
  }
}

/**
 * GET /api/account
 * Returns all accounts for the authenticated user.
 */
async function listAccounts(req, res) {
  try {
    const accounts = await accountModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ accounts });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch accounts.", status: "Failed" });
  }
}

/**
 * PATCH /api/account/:id/status
 * Changes account status (ACTIVE / FROZEN / CLOSED).
 * Business rules:
 *  - Cannot close with a non-zero balance
 *  - Cannot close with PENDING transactions
 *  - Owner can freeze/unfreeze their own account
 *    NOTE: In a future admin role, freezing should require admin approval —
 *    see the comment below as the intended gate point.
 */
async function updateAccountStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const account = await accountModel.findById(id);

    if (!account) {
      return res.status(404).json({ message: "Account not found", status: "Failed" });
    }

    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not own this account", status: "Failed" });
    }

    const previousStatus = account.status;

    // ── Business rules for CLOSING ────────────────────────────────────
    if (status === "CLOSED") {
      if (account.balance > 0) {
        return res.status(422).json({
          message: `Cannot close an account with a remaining balance of ₹${account.balance.toLocaleString("en-IN")}. Please withdraw or transfer your funds first.`,
          status: "Failed",
        });
      }

      const pendingCount = await transactionModel.countDocuments({
        $or: [{ fromAccount: id }, { toAccount: id }],
        status: "PENDING",
      });

      if (pendingCount > 0) {
        return res.status(422).json({
          message: `Cannot close account — ${pendingCount} pending transaction${pendingCount !== 1 ? "s" : ""} must complete first.`,
          status: "Failed",
        });
      }
    }

    // ── Gate point for admin role (future) ────────────────────────────
    // TODO: If status === 'FROZEN' and request originates from account owner (not admin),
    // consider requiring admin approval before unfreezing. For now, owner can
    // freeze and unfreeze freely. Add: if (status === 'ACTIVE' && previousStatus === 'FROZEN' && !req.user.isAdmin) { ... }

    account.status = status;
    await account.save();

    auditService.log({
      userId: req.user._id,
      action: "ACCOUNT_STATUS_CHANGED",
      targetId: account._id,
      targetType: "Account",
      ip: getClientIP(req),
      metadata: { from: previousStatus, to: status },
    });

    return res.status(200).json({
      message: `Account ${status.toLowerCase()} successfully.`,
      account,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update account status.", status: "Failed" });
  }
}

/**
 * GET /api/account/:id/transactions
 * Paginated, filtered transaction history for an account.
 * The requesting user must own the account.
 */
async function getTransactionHistory(req, res) {
  const { id } = req.params;
  const { page = 1, limit = 20, status, type, direction, startDate, endDate } = req.query;

  // Validated by Zod middleware — page/limit are already coerced to numbers
  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 100); // cap at 100

  try {
    const account = await accountModel.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found", status: "Failed" });
    }
    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not own this account", status: "Failed" });
    }

    // ── Build filter ──────────────────────────────────────────────────
    const filter = {};

    if (direction === "incoming") {
      filter.toAccount = id;
    } else if (direction === "outgoing") {
      filter.fromAccount = id;
    } else {
      // No direction filter — show all transactions involving this account
      filter.$or = [{ fromAccount: id }, { toAccount: id }];
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("fromAccount", "accountType currency")
        .populate("toAccount", "accountType currency"),
      transactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch transaction history.", status: "Failed" });
  }
}

module.exports = {
  createAccount,
  listAccounts,
  updateAccountStatus,
  getTransactionHistory,
};