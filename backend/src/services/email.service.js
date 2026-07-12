require('dotenv').config();
const nodemailer = require('nodemailer');

// ── Transporter — Gmail App Password (simpler + never expires) ─────────────
// To set up: Google Account → Security → 2-Step Verification → App Passwords
// Add EMAIL_PASS=<16-char-app-password> to your .env file.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email server connection failed:', error.message);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// ── Core send helper ───────────────────────────────────────────────────────
const sendEmail = async (to, subject, text, html) => {
  const info = await transporter.sendMail({
    from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
  console.log('Email sent:', info.messageId);
};

// ── OTP Verification Email ─────────────────────────────────────────────────
async function sendOTPEmail(userEmail, name, otp) {
  const subject = 'Your Backend Ledger Verification Code';
  const text = `Hello ${name},\n\nYour OTP verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— The Backend Ledger Team`;

  const html = `
    <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#0B0E13;padding:40px 0;">
      <div style="max-width:520px;margin:0 auto;background:#161B24;border:1px solid #2A2F3A;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <div style="padding:28px 32px;border-bottom:1px solid #2A2F3A;">
          <span style="font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B7280;">
            Backend Ledger
          </span>
        </div>

        <!-- Body -->
        <div style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:#EDEAE2;">
            Verify your email, ${name}.
          </h1>
          <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
            Enter the code below to confirm your email address and activate your account.
          </p>

          <!-- OTP block -->
          <div style="background:#0B0E13;border:1px solid #B68D40;border-radius:4px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-family:'Courier New',monospace;font-size:40px;font-weight:500;letter-spacing:0.25em;color:#B68D40;">
              ${otp}
            </span>
          </div>

          <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">
            This code expires in <strong style="color:#EDEAE2;">10 minutes</strong>.
            If you did not create a Backend Ledger account, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #2A2F3A;text-align:center;">
          <span style="font-family:monospace;font-size:11px;color:#6B7280;">
            © ${new Date().getFullYear()} Backend Ledger. All debits balanced.
          </span>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}

// ── Welcome Email (sent after OTP verified) ────────────────────────────────
async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger';
  const text = `Hello ${name},\n\nYour email has been verified and your account is now active. Welcome to Backend Ledger!\n\n— The Backend Ledger Team`;

  const html = `
    <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#0B0E13;padding:40px 0;">
      <div style="max-width:520px;margin:0 auto;background:#161B24;border:1px solid #2A2F3A;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <div style="padding:28px 32px;border-bottom:1px solid #2A2F3A;">
          <span style="font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B7280;">
            Backend Ledger
          </span>
        </div>

        <!-- Body -->
        <div style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:#EDEAE2;">
            Welcome aboard, ${name}.
          </h1>
          <p style="margin:0 0 20px;font-size:14px;color:#9CA3AF;line-height:1.6;">
            Your account has been verified. You can now log in and open your first ledger account.
          </p>

          <!-- Divider line (ledger rule) -->
          <div style="border-top:1px solid #B68D40;opacity:0.3;margin:24px 0;"></div>

          <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">
            Every entry balanced. Every account accounted for.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #2A2F3A;text-align:center;">
          <span style="font-family:monospace;font-size:11px;color:#6B7280;">
            © ${new Date().getFullYear()} Backend Ledger. All debits balanced.
          </span>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendOTPEmail,
  sendRegistrationEmail,
};