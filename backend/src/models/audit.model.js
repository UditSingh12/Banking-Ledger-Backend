const mongoose = require("mongoose");

/**
 * AuditLog — lightweight audit trail for sensitive actions.
 *
 * This is a ledger system; an audit trail on sensitive operations matters
 * as much as the transactions themselves. Records are append-only —
 * nothing in this collection should ever be updated or deleted.
 *
 * Indexed on userId + action for efficient queries ("show me all
 * transfers made by user X"). Indexed on createdAt for time-range queries.
 */
const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "TRANSFER",
        "DEPOSIT",
        "WITHDRAWAL",
        "REVERSAL",
        "ACCOUNT_CREATED",
        "ACCOUNT_STATUS_CHANGED",
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGED",
        "LOGIN_FAILED",
        "ACCOUNT_LOCKED",
      ],
      index: true,
    },
    // The primary resource affected (account ID, transaction ID, etc.)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String,
      default: null,
    },
    // IP address of the requesting client
    ip: {
      type: String,
      default: null,
    },
    // Any additional context useful for forensics
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ userId: 1, action: 1 });

const AuditLog = mongoose.model("AuditLog", auditSchema);

module.exports = AuditLog;
