/**
 * Email Service — sends OTPs via Gmail SMTP using Nodemailer
 * Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env
 */
const nodemailer = require('nodemailer');

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const getTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

/**
 * Generate a 6-digit OTP, store it, and send to the given email.
 */
exports.sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"AlumniConnect AI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🎓 Your AlumniConnect Verification Code',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#080b14;color:#f1f5f9;padding:40px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
        <h1 style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#a78bfa,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;">
          🎓 AlumniConnect AI
        </h1>
        <p style="color:#94a3b8;font-size:14px;margin-bottom:32px;">Email Verification</p>
        <p style="font-size:15px;margin-bottom:24px;">Use the code below to verify your email address. It expires in <strong>5 minutes</strong>.</p>
        <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
          <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#a78bfa;">${otp}</span>
        </div>
        <p style="color:#475569;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return true;
};

/**
 * Verify an OTP for a given email.
 * Returns { valid: true } or { valid: false, message: '...' }
 */
exports.verifyOtp = (email, inputOtp) => {
  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) return { valid: false, message: 'No OTP sent to this email. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  if (record.otp !== inputOtp.trim()) {
    return { valid: false, message: 'Incorrect OTP. Please try again.' };
  }

  otpStore.delete(key); // Single use
  return { valid: true };
};
