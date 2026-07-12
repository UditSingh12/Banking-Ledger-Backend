const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require('cors');

const app = express();

// ── CORS ── must be first, before all other middleware and routes
// Required so the React frontend (http://localhost:5173) can send
// HTTP-only cookies cross-origin (withCredentials: true on Axios).
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());                          // Middleware for JSON bodies
app.use(express.urlencoded({ extended: true }));  // Middleware for form submissions
app.use(cookieParser());                          // Middleware for reading cookies

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            message: "Invalid JSON payload",
            status: "Failed"
        });
    }

    return next(err);
});

/** 
    * - Routes Required
*/

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")

/** 
    * - Routes Used
*/

app.use("/api/auth", authRouter)

app.use("/api/account", accountRouter)

module.exports = app;