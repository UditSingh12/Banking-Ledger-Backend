require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = "Welcome to Backend Ledger!";
    const text = `Hello ${name},\n\nThank you for registering with Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; text-align: center; color: white;">
            <h1 style="margin: 0 0 8px; font-size: 28px;">Welcome aboard, ${name}!</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your journey with Backend Ledger starts now.</p>
          </div>
          <div style="padding: 28px; color: #1f2937;">
            <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80" alt="Team working together" style="width: 100%; border-radius: 12px; margin-bottom: 20px;" />
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">
              Thank you for joining Backend Ledger. You’re now part of a smarter way to manage your records, collaborate effortlessly, and stay on top of everything that matters.
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              We can’t wait to see what you build with us.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://yourdomain.com" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 999px; display: inline-block; font-weight: bold;">
                Explore Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0;">
              Need help getting started? Just reply to this email and our team will be happy to assist.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 16px 28px; text-align: center; color: #6b7280; font-size: 13px;">
            <p style="margin: 0;">Cheers,<br><strong>The Backend Ledger Team</strong></p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail
};