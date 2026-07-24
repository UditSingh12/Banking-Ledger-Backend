const mongoose = require("mongoose");

/**
 * Dispute — tracks user-raised disputes against completed transactions.
 *
 * Lifecycle: OPEN → UNDER_REVIEW → RESOLVED | REJECTED
 *
 * When a dispute is raised:
 *  1. A Dispute document is created with status OPEN.
 *  2. The linked Transaction's status is changed to DISPUTED.
 *
 * When an admin resolves or rejects:
 *  1. Dispute status is updated to RESOLVED or REJECTED.
 *  2. The Transaction status is optionally changed (e.g. back to COMPLETED, or REVERSED).
 */
const disputeSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      required: [true, "Linked transaction is required"],
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Dispute must be raised by a user"],
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Dispute reason is required"],
      minlength: [10, "Please provide at least 10 characters describing the issue"],
      maxlength: [1000, "Reason must be under 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
        message: "Status must be OPEN, UNDER_REVIEW, RESOLVED, or REJECTED",
      },
      default: "OPEN",
    },
    // Admin fills these on resolution/rejection
    resolution: {
      type: String,
      default: null,
      maxlength: [2000, "Resolution must be under 2000 characters"],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin list queries — ordered by createdAt desc, filtered by status
disputeSchema.index({ status: 1, createdAt: -1 });

const disputeModel = mongoose.model("dispute", disputeSchema);

module.exports = disputeModel;
