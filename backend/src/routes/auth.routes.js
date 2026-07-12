const express = require("express");
const authController = require("../controllers/auth.controllers");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/*
 * POST /api/auth/register
 * Public — creates unverified user, sends OTP email
 */
router.post("/register", authController.userRegisterController);

/*
 * POST /api/auth/verify-email
 * Public — verifies OTP, marks user as verified
 */
router.post("/verify-email", authController.verifyEmailController);

/*
 * POST /api/auth/resend-otp
 * Public — generates and resends a fresh OTP
 */
router.post("/resend-otp", authController.resendOTPController);

/*
 * POST /api/auth/login
 * Public — authenticates user (must be verified), sets JWT cookie
 */
router.post("/login", authController.userLoginController);

/*
 * POST /api/auth/change-password
 * Protected — verifies current password, updates to new password
 */
router.post(
  "/change-password",
  authMiddleware.authMiddleware,
  authController.changePasswordController
);

module.exports = router;