const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema,
  changePasswordSchema,
  totpCodeSchema,
} = require("../middlewares/validators");

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes.", status: "TooManyRequests" },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again in 15 minutes.", status: "TooManyRequests" },
});

// ── Public routes ─────────────────────────────────────────────────────────

router.post("/register", registerLimiter, validate(registerSchema), authController.userRegisterController);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmailController);
router.post("/resend-otp", validate(resendOTPSchema), authController.resendOTPController);
router.post("/login", loginLimiter, validate(loginSchema), authController.userLoginController);

// ── Protected routes ──────────────────────────────────────────────────────

router.post("/logout", authMiddleware, authController.logoutController);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), authController.changePasswordController);

// ── 2FA / TOTP routes ─────────────────────────────────────────────────────

/**
 * POST /api/auth/2fa/setup
 * Generates a TOTP secret + QR-code URI. Secret is saved but not yet active.
 * User must call /2fa/confirm with a valid code to activate 2FA.
 */
router.post("/2fa/setup", authMiddleware, authController.setup2FA);

/**
 * POST /api/auth/2fa/confirm
 * Validates the TOTP code against the pending secret. Enables 2FA on success.
 */
router.post("/2fa/confirm", authMiddleware, validate(totpCodeSchema), authController.confirm2FA);

/**
 * POST /api/auth/2fa/disable
 * Disables 2FA after verifying a valid TOTP code.
 */
router.post("/2fa/disable", authMiddleware, validate(totpCodeSchema), authController.disable2FA);

/**
 * POST /api/auth/2fa/verify-step-up
 * Validates a TOTP code for step-up auth (e.g. large transfers).
 * Returns { verified: true } — does not mutate any state.
 */
router.post("/2fa/verify-step-up", authMiddleware, validate(totpCodeSchema), authController.verifyStepUp2FA);

module.exports = router;