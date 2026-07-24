const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true,
    },
    accountType: {
      type: String,
      enum: {
        values: ["SAVINGS", "CURRENT"],
        message: "Account type must be SAVINGS or CURRENT",
      },
      required: [true, "Account type is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status must be ACTIVE, FROZEN, or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "INR",
    },
    // Hard minimum of 0 — never let balance go negative at the schema level.
    // Enforcement of "insufficient balance" is done in the transfer service
    // before writing (atomic $inc), so this is purely a safety backstop.
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    // ── Risk / Velocity limits ─────────────────────────────────────────────
    // Per-account configurable limits. Defaults match safe production values.
    // Admins can adjust via PATCH /api/admin/accounts/:id/limits.
    dailyTransferLimit: {
      type: Number,
      default: 100000, // ₹1 lakh per day
      min: [0, "Daily limit cannot be negative"],
    },
    singleTransferLimit: {
      type: Number,
      default: 25000, // ₹25k per single transfer
      min: [0, "Single transfer limit cannot be negative"],
    },

    // ── Risk flag ──────────────────────────────────────────────────────────
    // Set automatically by the risk engine (e.g. first transfer to a new
    // recipient above ₹10k) or manually by an admin.
    // Admins can clear this flag via POST /api/admin/accounts/:id/flag.
    riskFlag: {
      type: Boolean,
      default: false,
    },
    riskReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound unique index: one SAVINGS and one CURRENT per user ────────────
accountSchema.index({ user: 1, accountType: 1 }, { unique: true });

// ── Composite index for efficient account lookups by user + status ─────────
accountSchema.index({ user: 1, status: 1 });

const accountModel = mongoose.model("accounts", accountSchema);

module.exports = accountModel;
