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
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "Status must be PENDING, COMPLETED, FAILED, or REVERSED",
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

    // ── Gateway hook point ─────────────────────────────────────────────
    // INTERNAL = handled by this service's own transfer logic.
    // GATEWAY  = initiated via an external payment provider (Razorpay etc.).
    // This field keeps gateway concerns outside the core transfer service —
    // a gateway integration only needs to set source: 'GATEWAY' and provide
    // any provider-specific metadata in a separate field.
    source: {
      type: String,
      enum: ["INTERNAL", "GATEWAY"],
      default: "INTERNAL",
    },

    // ── Reversal linkage ───────────────────────────────────────────────
    // reversalOf: set on a REVERSAL transaction, pointing to the original
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      default: null,
    },
    // reversedBy: set on the ORIGINAL transaction once it's been reversed
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
    // timestamps: true MUST be in the options object, not inside the schema
    // body — this was a bug in the original model causing createdAt/updatedAt
    // to silently not be added to documents.
    timestamps: true,
  }
);

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
