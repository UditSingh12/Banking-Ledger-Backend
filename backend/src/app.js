const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// ── Make req.query writable in Express 5 ─────────────────────────────────
// In Express 5, req.query is an immutable getter. This middleware unpacks
// it into a standard writable property so third-party middleware (like
// express-mongo-sanitize) and custom validator middlewares can mutate it.
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});

// ── Security headers (must be first) ─────────────────────────────────────
// Helmet sets a suite of secure HTTP headers: X-Frame-Options, X-XSS-Protection,
// Strict-Transport-Security, Content-Security-Policy, etc.
app.use(helmet());

// ── CORS — strict allowlist, credentials enabled ──────────────────────────
// Only the configured frontend origins can send requests with cookies.
// Never use '*' with credentials: true — browsers block it anyway.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));          // cap body size, mitigate DoS
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Mongo injection protection ────────────────────────────────────────────
// Strips keys starting with '$' or containing '.' from user-controlled input.
// Defends against query injection attacks like { password: { $gt: '' } }.
app.use(mongoSanitize());

// ── Routes ────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transaction", transactionRouter);

// ── Global error handler (must be last — after all routes) ───────────────
app.use((err, req, res, next) => {
  // CORS errors from the origin check above
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message, status: "Failed" });
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload", status: "Failed" });
  }

  console.error("[Unhandled Error]", err);
  return res.status(500).json({ message: "An unexpected error occurred", status: "Failed" });
});

module.exports = app;