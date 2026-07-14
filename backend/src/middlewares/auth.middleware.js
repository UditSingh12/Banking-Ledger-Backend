const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");

/**
 * authMiddleware — verifies the JWT cookie and attaches req.user.
 *
 * Token invalidation via tokenVersion:
 * Every JWT payload includes { userId, tokenVersion }.
 * On logout or password change, the user's tokenVersion in the DB is incremented.
 * If decoded.tokenVersion !== user.tokenVersion, the token is stale and rejected.
 * This means logout actually invalidates the token server-side, not just client-side.
 */
async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
      status: "Failed",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
        status: "Failed",
      });
    }

    // ── tokenVersion check — this is what makes logout real ─────────
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session has been invalidated. Please log in again.",
        code: "TOKEN_INVALIDATED",
        status: "Failed",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
      status: "Failed",
    });
  }
}

module.exports = { authMiddleware };