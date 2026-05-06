/**
 * Email Service — sends OTPs via Gmail SMTP using Nodemailer
 *
 * OTPs are persisted in MongoDB (OtpVerification collection) so they survive
 * server restarts on Render free tier. A MongoDB TTL index auto-deletes them
 * after 10 minutes.
 *
 * Environment variables required on Render:
 *   GMAIL_USER          — your Gmail address
 *   GMAIL_APP_PASSWORD  — 16-char App Password (NOT your real password)
 *   Generate one at: https://myaccount.google.com/apppasswords (needs 2FA)
 */
const nodemailer = require('nodemailer');
const OtpVerification = require('../models/OtpVerification');

const getTransporter = () => {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EmailService] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

/**
 * Generate a 6-digit OTP, persist it to MongoDB, and email it.
 * Throws on Gmail auth failure so the controller can return a meaningful error.
 */
exports.sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const key = email.toLowerCase();

  // Upsert into MongoDB (replace any existing OTP for this email)
  await OtpVerification.findOneAndUpdate(
    { email: key },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const transporter = getTransporter();
  if (transporter) {
    // Properly awaited — Gmail errors now propagate to the calling controller
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
          <p style="font-size:15px;margin-bottom:24px;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#a78bfa;">${otp}</span>
          </div>
          <p style="color:#475569;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[EmailService] OTP email sent to ${email}`);
    return { delivered: true };
  }

  // Fallback: no SMTP configured — log the OTP for manual use (dev/testing only)
  console.warn(`[EmailService] Email service not configured. OTP for ${email}: ${otp}`);
  return { delivered: false, otp };
};

/**
 * Verify an OTP for a given email using MongoDB.
 * Returns { valid: true } or { valid: false, message: '...' }
 */
exports.verifyOtp = async (email, inputOtp) => {
  const key = email.toLowerCase();
  const record = await OtpVerification.findOne({ email: key });

  if (!record) {
    return { valid: false, message: 'No OTP sent to this email. Please request a new one.' };
  }

  if (record.otp !== inputOtp.trim()) {
    return { valid: false, message: 'Incorrect OTP. Please try again.' };
  }

  // Delete after single use
  await OtpVerification.deleteOne({ email: key });
  return { valid: true };
};
