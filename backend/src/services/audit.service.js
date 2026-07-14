const AuditLog = require("../models/audit.model");

/**
 * Logs an audit entry for a sensitive action.
 *
 * This function is intentionally non-blocking and swallows errors —
 * a failure to write an audit log should NEVER cause a business operation
 * (transfer, login, etc.) to fail for the end user.
 *
 * @param {{ userId, action, targetId?, targetType?, ip?, metadata? }} opts
 */
async function log({ userId, action, targetId = null, targetType = null, ip = null, metadata = null }) {
  try {
    await AuditLog.create({ userId, action, targetId, targetType, ip, metadata });
  } catch (err) {
    // Swallow — audit log failure must not surface to the user
    console.error("[AuditService] Failed to write audit log:", err.message);
  }
}

module.exports = { log };
