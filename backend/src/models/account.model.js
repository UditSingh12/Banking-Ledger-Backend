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
    // before writing, so this is purely a safety backstop.
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound unique index: one SAVINGS and one CURRENT per user ────────────
// On duplicate key error (code 11000), the controller returns a clean 409
// with a human-readable message instead of leaking the Mongo error.
accountSchema.index({ user: 1, accountType: 1 }, { unique: true });

// ── Composite index for efficient account lookups by user + status ─────────
accountSchema.index({ user: 1, status: 1 });

const accountModel = mongoose.model("accounts", accountSchema);

module.exports = accountModel;
