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
} = require("../middlewares/validators");

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
    status: "TooManyRequests",
  },
  skipSuccessfulRequests: true, // don't count successful logins against the limit
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please try again in 15 minutes.",
    status: "TooManyRequests",
  },
});

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public — creates unverified user, sends OTP email
 */
router.post("/register", registerLimiter, validate(registerSchema), authController.userRegisterController);

/**
 * POST /api/auth/verify-email
 * Public — verifies OTP, marks user as verified
 */
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmailController);

/**
 * POST /api/auth/resend-otp
 * Public — generates and resends a fresh OTP
 */
router.post("/resend-otp", validate(resendOTPSchema), authController.resendOTPController);

/**
 * POST /api/auth/login
 * Public — authenticates user (must be verified), sets JWT cookie
 */
router.post("/login", loginLimiter, validate(loginSchema), authController.userLoginController);

/**
 * POST /api/auth/logout
 * Protected — increments tokenVersion (server-side token invalidation), clears cookie
 */
router.post("/logout", authMiddleware, authController.logoutController);

/**
 * POST /api/auth/change-password
 * Protected — verifies current password, updates to new, invalidates all sessions
 */
router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePasswordController
);

module.exports = router;