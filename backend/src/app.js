const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// ── Express 5 Mongo Sanitize fix ──────────────────────────────────────────
// express-mongo-sanitize's default middleware tries to reassign req.query,
// which crashes in Express 5. We apply the sanitization manually in-place.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
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
// (Applied manually above via mongoSanitize.sanitize)

// ── Routes ────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");
const adminRouter = require("./routes/admin.routes");

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/admin", adminRouter);

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