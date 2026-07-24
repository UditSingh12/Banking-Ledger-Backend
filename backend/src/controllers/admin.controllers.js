const userModel = require("../models/user.models");
const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const disputeModel = require("../models/dispute.model");
const auditService = require("../services/audit.service");

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

/**
 * GET /api/admin/users
 * List all users (paginated). Never returns password/OTP/secrets.
 */
async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page ?? 1, 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? 20, 10)));

  try {
    const [users, total] = await Promise.all([
      userModel
        .find()
        .select("-password -otp -otpExpiry -twoFactorSecret")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      userModel.countDocuments(),
    ]);

    return res.status(200).json({
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users.", status: "Failed" });
  }
}

/**
 * POST /api/admin/users/:id/unlock
 * Resets failed login attempts, clears lockout, clears risk flag.
 */
async function unlockUser(req, res) {
  const { id } = req.params;

  try {
    const user = await userModel.findByIdAndUpdate(
      id,
      { failedLoginAttempts: 0, lockUntil: null },
      { new: true, select: "-password -otp -otpExpiry -twoFactorSecret" }
    );

    if (!user) return res.status(404).json({ message: "User not found", status: "Failed" });

    auditService.log({
      userId: req.user._id,
      action: "ADMIN_USER_UNLOCKED",
      targetId: id,
      targetType: "User",
      ip: getClientIP(req),
    });

    return res.status(200).json({ user, message: "User account unlocked." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to unlock user.", status: "Failed" });
  }
}

/**
 * GET /api/admin/transactions
 * List all transactions (paginated + filtered).
 */
async function listTransactions(req, res) {
  const page = Math.max(1, parseInt(req.query.page ?? 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 20, 10)));

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type)   filter.type   = req.query.type;
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  try {
    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("fromAccount", "accountType user")
        .populate("toAccount", "accountType user"),
      transactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch transactions.", status: "Failed" });
  }
}

/**
 * POST /api/admin/accounts/:id/flag
 * Sets or clears the riskFlag on an account.
 * Body: { riskFlag: boolean, riskReason?: string }
 */
async function flagAccount(req, res) {
  const { id } = req.params;
  const { riskFlag, riskReason = null } = req.body;

  try {
    const account = await accountModel.findByIdAndUpdate(
      id,
      { riskFlag, riskReason: riskFlag ? riskReason : null },
      { new: true }
    );

    if (!account) return res.status(404).json({ message: "Account not found", status: "Failed" });

    auditService.log({
      userId: req.user._id,
      action: riskFlag ? "ADMIN_ACCOUNT_FLAGGED" : "ADMIN_ACCOUNT_FLAG_CLEARED",
      targetId: id,
      targetType: "Account",
      ip: getClientIP(req),
      metadata: { riskFlag, riskReason },
    });

    return res.status(200).json({
      account,
      message: riskFlag ? "Account flagged for risk review." : "Risk flag cleared.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update account flag.", status: "Failed" });
  }
}

/**
 * GET /api/admin/disputes
 * List all disputes (paginated + filtered by status).
 */
async function listDisputes(req, res) {
  const page = Math.max(1, parseInt(req.query.page ?? 1, 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? 20, 10)));

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  try {
    const [disputes, total] = await Promise.all([
      disputeModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("transaction", "amount type status createdAt")
        .populate("raisedBy", "name email")
        .populate("resolvedBy", "name email"),
      disputeModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      disputes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch disputes.", status: "Failed" });
  }
}

/**
 * POST /api/admin/disputes/:id/resolve
 * Resolves or rejects a dispute.
 * Body: { status: 'RESOLVED'|'REJECTED', resolution: string }
 */
async function resolveDispute(req, res) {
  const { id } = req.params;
  const { status, resolution } = req.body;

  try {
    const dispute = await disputeModel.findById(id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found", status: "Failed" });

    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
      return res.status(409).json({
        message: `Dispute is already ${dispute.status.toLowerCase()}.`,
        status: "Conflict",
      });
    }

    dispute.status = status;
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // If resolved, revert transaction status back to COMPLETED; if rejected, keep DISPUTED
    if (status === "RESOLVED") {
      await transactionModel.findByIdAndUpdate(dispute.transaction, { status: "COMPLETED" });
    }

    auditService.log({
      userId: req.user._id,
      action: `ADMIN_DISPUTE_${status}`,
      targetId: dispute._id,
      targetType: "Dispute",
      ip: getClientIP(req),
      metadata: { resolution },
    });

    return res.status(200).json({ dispute, message: `Dispute ${status.toLowerCase()}.` });
  } catch (err) {
    return res.status(500).json({ message: "Failed to resolve dispute.", status: "Failed" });
  }
}

module.exports = {
  listUsers,
  unlockUser,
  listTransactions,
  flagAccount,
  listDisputes,
  resolveDispute,
};
