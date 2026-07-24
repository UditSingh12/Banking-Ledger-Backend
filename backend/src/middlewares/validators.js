const { z } = require("zod");

/**
 * Zod validation middleware factory.
 *
 * Usage: router.post("/route", validate(mySchema), controller)
 *
 * On failure, returns a 400 with an array of { field, message } objects.
 * Never leaks internal details — only validated, whitelisted data reaches controllers.
 *
 * @param {z.ZodSchema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ message: "Validation failed", errors, status: "Failed" });
    }
    // Replace req[source] with the validated (and stripped of extra keys) data
    req[source] = result.data;
    next();
  };
}

// ── Auth schemas ───────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name is too long").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .refine((p) => !/^\d+$/.test(p), "Password cannot be all numbers"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

const resendOTPSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password is too long")
    .refine((p) => !/^\d+$/.test(p), "Password cannot be all numbers"),
});

// ── Account schemas ────────────────────────────────────────────────────────

const createAccountSchema = z.object({
  accountType: z.enum(["SAVINGS", "CURRENT"], {
    required_error: "Account type is required",
    invalid_type_error: "Account type must be SAVINGS or CURRENT",
  }),
  // currency is optional — defaults to INR server-side
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional().default("INR"),
});

const accountStatusSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN", "CLOSED"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be ACTIVE, FROZEN, or CLOSED",
  }),
});

// ── Transaction schemas ────────────────────────────────────────────────────

const transferSchema = z.object({
  fromAccount: z.string().min(1, "Source account ID is required"),
  toAccount: z.string().min(1, "Destination account ID is required"),
  amount: z.number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" }).positive("Amount must be greater than zero"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

const reversalSchema = z.object({
  reason: z.string().min(3, "Please provide a reason of at least 3 characters").max(500, "Reason is too long").optional(),
});

// ── Transaction history query params ──────────────────────────────────────
const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REVERSED", "DISPUTED"]).optional(),
  type: z.enum(["TRANSFER", "DEPOSIT", "WITHDRAWAL", "REVERSAL"]).optional(),
  direction: z.enum(["incoming", "outgoing"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ── 2FA / TOTP schema ─────────────────────────────────────────────────────
const totpCodeSchema = z.object({
  totpCode: z.string().length(6, "TOTP code must be exactly 6 digits").regex(/^\d{6}$/, "TOTP code must contain only digits"),
});

// ── Dispute schema ────────────────────────────────────────────────────────
const disputeSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide at least 10 characters describing the issue")
    .max(1000, "Reason must be under 1000 characters"),
});

// ── Admin schemas ─────────────────────────────────────────────────────────
const adminFlagSchema = z.object({
  riskFlag: z.boolean(),
  riskReason: z.string().max(500).optional().nullable(),
});

const adminDisputeResolveSchema = z.object({
  status: z.enum(["RESOLVED", "REJECTED"]),
  resolution: z.string().min(5, "Please provide a resolution of at least 5 characters").max(2000),
});

const adminUnlockSchema = z.object({}).optional();

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema,
  changePasswordSchema,
  createAccountSchema,
  accountStatusSchema,
  transferSchema,
  reversalSchema,
  transactionQuerySchema,
  totpCodeSchema,
  disputeSchema,
  adminFlagSchema,
  adminDisputeResolveSchema,
  adminUnlockSchema,
};
