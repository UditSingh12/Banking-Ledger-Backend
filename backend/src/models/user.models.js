const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a User"],
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email Address"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password should be at least 8 characters"],
      select: false,
    },

    // ── Email verification via OTP ─────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,   // never returned in queries by default
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Hash password on save (only when modified) ─────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ── Instance methods ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.compareOTP = async function (plainOTP) {
  return await bcrypt.compare(plainOTP, this.otp);
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
