const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // null on DEPOSIT (no source account) or WITHDRAWAL (no destination account)
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      default: null,
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["TRANSFER", "DEPOSIT", "WITHDRAWAL", "REVERSAL"],
        message: "Transaction type must be TRANSFER, DEPOSIT, WITHDRAWAL, or REVERSAL",
      },
      required: [true, "Transaction type is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED", "DISPUTED"],
        message: "Status must be PENDING, COMPLETED, FAILED, REVERSED, or DISPUTED",
      },
      default: "PENDING",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Transaction amount must be greater than zero"],
    },
    idempotencyKey: {
      type: String,
      required: [true, "Idempotency key is required"],
      unique: true,
      index: true,
    },

    // ── Gateway hook point ─────────────────────────────────────────────────
    // INTERNAL = handled by this service's own transfer logic.
    // GATEWAY  = initiated via an external payment provider (Razorpay etc.).
    source: {
      type: String,
      enum: ["INTERNAL", "GATEWAY"],
      default: "INTERNAL",
    },

    // ── Reversal linkage ───────────────────────────────────────────────────
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      default: null,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      default: null,
    },

    // Optional metadata/notes (e.g. reversal reason)
    note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
