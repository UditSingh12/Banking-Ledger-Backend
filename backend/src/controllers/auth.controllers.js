const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");
const auditService = require("../services/audit.service");
const { authenticator } = require("otplib");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Helpers ───────────────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiryTime() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Signs a JWT embedding tokenVersion so old tokens can be invalidated server-side.
 * Also embeds role so the frontend can determine access level without an extra fetch.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "14d" }
  );
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? "strict" : "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

// ── Controllers ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  try {
    const existingVerified = await userModel.findOne({ email, isVerified: true });
    if (existingVerified) {
      return res.status(422).json({
        message: "An account with this email already exists. Please log in.",
        status: "Failed",
      });
    }

    let user = await userModel.findOne({ email, isVerified: false });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    if (user) {
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

    emailService.sendOTPEmail(user.email, user.name, otp).catch((e) =>
      console.error("[Auth] OTP email failed:", e.message)
    );

    return res.status(201).json({
      message: "Account created. An OTP has been sent to your email address.",
      userId: user._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed. Please try again.", status: "Failed" });
  }
}

/**
 * POST /api/auth/verify-email
 */
async function verifyEmailController(req, res) {
  const { userId, otp } = req.body;

  try {
    const user = await userModel.findById(userId).select("+otp +otpExpiry");

    if (!user) return res.status(404).json({ message: "User not found", status: "Failed" });
    if (user.isVerified) return res.status(400).json({ message: "This account is already verified. Please log in.", status: "Failed" });
    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: "No OTP found. Please request a new one.", status: "Failed" });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: "OTP has expired. Please request a new one.", status: "Failed" });

    const isOTPValid = await user.compareOTP(otp);
    if (!isOTPValid) return res.status(400).json({ message: "Invalid OTP. Please check your email and try again.", status: "Failed" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    emailService.sendRegistrationEmail(user.email, user.name).catch((e) =>
      console.error("[Auth] Welcome email failed:", e.message)
    );

    return res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Verification failed. Please try again.", status: "Failed" });
  }
}

/**
 * POST /api/auth/resend-otp
 */
async function resendOTPController(req, res) {
  const { userId } = req.body;

  try {
    const user = await userModel.findById(userId).select("+otp +otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found", status: "Failed" });
    if (user.isVerified) return res.status(400).json({ message: "This account is already verified.", status: "Failed" });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    user.otp = hashedOTP;
    user.otpExpiry = otpExpiryTime();
    await user.save();

    emailService.sendOTPEmail(user.email, user.name, otp).catch((e) =>
      console.error("[Auth] Resend OTP email failed:", e.message)
    );

    return res.status(200).json({ message: "A new OTP has been sent to your email address." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to resend OTP. Please try again.", status: "Failed" });
  }
}

/**
 * POST /api/auth/login
 */
async function userLoginController(req, res) {
  const { email, password } = req.body;
  const ip = getClientIP(req);

  try {
    const user = await userModel.findOne({ email }).select("+password +failedLoginAttempts +lockUntil");

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password.", status: "Failed" });
    }

    if (user.isLocked()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMins} minute${remainingMins !== 1 ? "s" : ""}.`,
        lockedUntil: user.lockUntil,
        status: "Locked",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        userId: user._id,
        status: "Unverified",
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      user.failedLoginAttempts += 1;
      const updates = { failedLoginAttempts: user.failedLoginAttempts };

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await userModel.findByIdAndUpdate(user._id, updates);
        auditService.log({ userId: user._id, action: "ACCOUNT_LOCKED", ip, metadata: { attempts: user.failedLoginAttempts } });

        return res.status(423).json({
          message: "Too many failed attempts. Account locked for 15 minutes.",
          lockedUntil: updates.lockUntil,
          status: "Locked",
        });
      }

      await userModel.findByIdAndUpdate(user._id, updates);
      auditService.log({ userId: user._id, action: "LOGIN_FAILED", ip, metadata: { attempts: user.failedLoginAttempts } });

      const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      return res.status(401).json({
        message: `Incorrect password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.`,
        status: "Failed",
      });
    }

    await userModel.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockUntil: null });

    const token = signToken(user);
    setAuthCookie(res, token);

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    auditService.log({ userId: user._id, action: "LOGIN", ip });

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed. Please try again.", status: "Failed" });
  }
}

/**
 * POST /api/auth/logout (protected)
 */
async function logoutController(req, res) {
  try {
    await userModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? "strict" : "lax",
    });

    auditService.log({ userId: req.user._id, action: "LOGOUT", ip: getClientIP(req) });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed.", status: "Failed" });
  }
}

/**
 * POST /api/auth/change-password (protected)
 */
async function changePasswordController(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: "New password must be different from your current password",
      status: "Failed",
    });
  }

  try {
    const user = await userModel.findById(req.user._id).select("+password");
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect", status: "Failed" });
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? "strict" : "lax",
    });

    auditService.log({ userId: user._id, action: "PASSWORD_CHANGED", ip: getClientIP(req) });

    return res.status(200).json({ message: "Password changed successfully. Please log in again." });
  } catch (error) {
    return res.status(500).json({ message: "Password change failed. Please try again.", status: "Failed" });
  }
}

// ── 2FA / TOTP ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/2fa/setup (protected)
 * Generates a new TOTP secret and returns a QR-code URI for the authenticator app.
 * The secret is NOT saved until the user verifies it with a valid code.
 */
async function setup2FA(req, res) {
  try {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(req.user.email, "Ledger", secret);

    // Store pending secret in the user document (overwritten until confirmed)
    await userModel.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret });

    return res.status(200).json({
      secret,
      otpAuthUrl,
      message: "Scan the QR code with your authenticator app, then call /2fa/confirm with the 6-digit code.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to set up 2FA. Please try again.", status: "Failed" });
  }
}

/**
 * POST /api/auth/2fa/confirm (protected)
 * Verifies the TOTP code and enables 2FA on the account.
 */
async function confirm2FA(req, res) {
  const { totpCode } = req.body;

  try {
    const user = await userModel.findById(req.user._id).select("+twoFactorSecret");

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "Please call /2fa/setup first.", status: "Failed" });
    }

    const isValid = authenticator.check(totpCode, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid authenticator code. Please try again.", status: "Failed" });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({ message: "Two-factor authentication enabled successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to confirm 2FA.", status: "Failed" });
  }
}

/**
 * POST /api/auth/2fa/disable (protected)
 * Disables 2FA after verifying a valid TOTP code.
 */
async function disable2FA(req, res) {
  const { totpCode } = req.body;

  try {
    const user = await userModel.findById(req.user._id).select("+twoFactorSecret");

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled on this account.", status: "Failed" });
    }

    const isValid = authenticator.check(totpCode, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid authenticator code.", status: "Failed" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    return res.status(200).json({ message: "Two-factor authentication has been disabled." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to disable 2FA.", status: "Failed" });
  }
}

/**
 * POST /api/auth/2fa/verify-step-up (protected)
 * Lightweight step-up verification endpoint — validates a TOTP code without
 * any other side-effects. Used by the transfer wizard to gate large transfers.
 */
async function verifyStepUp2FA(req, res) {
  const { totpCode } = req.body;

  try {
    const user = await userModel.findById(req.user._id).select("+twoFactorSecret");

    if (!user.twoFactorEnabled) {
      return res.status(200).json({ verified: true, message: "2FA not required." });
    }

    const isValid = authenticator.check(totpCode, user.twoFactorSecret);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid authenticator code.", status: "Failed" });
    }

    return res.status(200).json({ verified: true });
  } catch (error) {
    return res.status(500).json({ message: "Step-up verification failed.", status: "Failed" });
  }
}

module.exports = {
  userRegisterController,
  verifyEmailController,
  resendOTPController,
  userLoginController,
  logoutController,
  changePasswordController,
  setup2FA,
  confirm2FA,
  disable2FA,
  verifyStepUp2FA,
};
