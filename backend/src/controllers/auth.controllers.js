const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");

// ── Helper: generate 6-digit OTP ──────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Helper: build OTP expiry (10 minutes from now) ────────────────────────
function otpExpiryTime() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * POST /api/auth/register
 * Creates an unverified user, sends OTP email.
 * Does NOT set a JWT cookie — login happens only after email verification.
 */
async function userRegisterController(req, res) {
  const { email, name, password } = req.body || {};

  if (!email || !name || !password) {
    return res.status(400).json({
      message: "Email, name, and password are required",
      status: "Failed",
    });
  }

  try {
    // Check for an existing verified account
    const existingVerified = await userModel.findOne({ email, isVerified: true });
    if (existingVerified) {
      return res.status(422).json({
        message: "An account with this email already exists. Please log in.",
        status: "Failed",
      });
    }

    // If an unverified account exists from a previous attempt, reuse it
    let user = await userModel.findOne({ email, isVerified: false });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    if (user) {
      // Refresh OTP on the existing unverified account
      user.name = name;
      user.password = password;
      user.otp = hashedOTP;
      user.otpExpiry = otpExpiryTime();
      await user.save();
    } else {
      user = await userModel.create({
        email,
        name,
        password,
        otp: hashedOTP,
        otpExpiry: otpExpiryTime(),
      });
    }

    // Send OTP email — non-blocking, log errors without crashing
    try {
      await emailService.sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      console.error("OTP email failed:", emailError.message);
    }

    return res.status(201).json({
      message: "Account created. An OTP has been sent to your email address.",
      userId: user._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: "Failed",
    });
  }
}

/**
 * POST /api/auth/verify-email
 * Verifies the 6-digit OTP. Marks the user as verified.
 * Sends the welcome email on success.
 */
async function verifyEmailController(req, res) {
  const { userId, otp } = req.body || {};

  if (!userId || !otp) {
    return res.status(400).json({
      message: "User ID and OTP are required",
      status: "Failed",
    });
  }

  try {
    const user = await userModel
      .findById(userId)
      .select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "Failed",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "This account is already verified. Please log in.",
        status: "Failed",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        message: "No OTP found. Please request a new one.",
        status: "Failed",
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
        status: "Failed",
      });
    }

    const isOTPValid = await user.compareOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        message: "Invalid OTP. Please check your email and try again.",
        status: "Failed",
      });
    }

    // Mark verified, clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email — non-blocking
    try {
      await emailService.sendRegistrationEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: "Failed",
    });
  }
}

/**
 * POST /api/auth/resend-otp
 * Generates a fresh OTP and resends it to the user's email.
 */
async function resendOTPController(req, res) {
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: "User ID is required", status: "Failed" });
  }

  try {
    const user = await userModel.findById(userId).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found", status: "Failed" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "This account is already verified.",
        status: "Failed",
      });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.otp = hashedOTP;
    user.otpExpiry = otpExpiryTime();
    await user.save();

    try {
      await emailService.sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      console.error("Resend OTP email failed:", emailError.message);
    }

    return res.status(200).json({
      message: "A new OTP has been sent to your email address.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: "Failed" });
  }
}

/**
 * POST /api/auth/login
 * Authenticates the user. Blocks unverified accounts with a 403.
 * Sets a JWT cookie on success.
 */
async function userLoginController(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
      status: "Failed",
    });
  }

  try {
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "No account found with this email address.",
        status: "Failed",
      });
    }

    // Block unverified accounts — return userId so frontend can offer re-verify
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        userId: user._id,
        status: "Unverified",
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Incorrect password.",
        status: "Failed",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "14d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in ms
    });

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: "Failed" });
  }
}

/**
 * POST /api/auth/change-password
 * Protected route — requires valid JWT cookie (authMiddleware).
 * Verifies the current password before updating to the new one.
 */
async function changePasswordController(req, res) {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
      status: "Failed",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "New password must be at least 8 characters",
      status: "Failed",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: "New password must be different from your current password",
      status: "Failed",
    });
  }

  try {
    // req.user is set by authMiddleware but without password — fetch with +password
    const user = await userModel.findById(req.user._id).select("+password");

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
        status: "Failed",
      });
    }

    user.password = newPassword;   // pre-save hook will hash it
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: "Failed" });
  }
}

module.exports = {
  userRegisterController,
  verifyEmailController,
  resendOTPController,
  userLoginController,
  changePasswordController,
};
