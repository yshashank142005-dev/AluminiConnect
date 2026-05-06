/**
 * Email Service — OTP delivery with Gmail SMTP + Resend fallback
 *
 * Priority:
 *   1. Resend API  (set RESEND_API_KEY)  ← most reliable on cloud/Render
 *   2. Gmail SMTP  (set GMAIL_USER + GMAIL_APP_PASSWORD) ← with 10s timeout to prevent hanging
 *   3. Console log fallback (dev mode)
 *
 * Why the 10s timeout?
 *   Cloud providers (Render, Railway, etc.) sometimes block outbound SMTP.
 *   Without a timeout, `await transporter.sendMail()` hangs forever,
 *   causing the frontend to show "Sending..." indefinitely.
 *
 * OTPs are persisted in MongoDB (OtpVerification) with a TTL index
 * so they survive server restarts on Render's free tier.
 */
const nodemailer = require('nodemailer');
const OtpVerification = require('../models/OtpVerification');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Gmail SMTP transporter, or null if env vars not set. */
const getGmailTransporter = () => {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000, // 10 s — abort if Gmail can't be reached
    socketTimeout: 10000,
  });
};

/** Returns a Resend sender function, or null if API key not set. */
const getResendSender = () => {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key || key === 're_your_api_key_here') return null;

  const { Resend } = require('resend');
  const client = new Resend(key);

  return async (to, html, subject) => {
    const { error } = await client.emails.send({
      from: 'AlumniConnect AI <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });
    if (error) throw new Error(error.message || 'Resend API error');
  };
};

/** Wraps a promise with a timeout — rejects after `ms` milliseconds. */
const withTimeout = (promise, ms, msg) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);

// ─── Email HTML template ─────────────────────────────────────────────────────
const otpHtml = (otp) => `
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
`;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a 6-digit OTP, persist it to MongoDB, then try to email it.
 * Tries Resend first, falls back to Gmail SMTP, then console log.
 */
exports.sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const subject = '🎓 Your AlumniConnect Verification Code';
  const html = otpHtml(otp);

  // Persist OTP to MongoDB (survives server restarts)
  await OtpVerification.findOneAndUpdate(
    { email: email.toLowerCase() },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  // ── Try Resend first (HTTPS, most reliable on cloud) ──────────────────────
  const resendSend = getResendSender();
  if (resendSend) {
    await resendSend(email, html, subject);
    console.log(`[EmailService] OTP sent via Resend to ${email}`);
    return { delivered: true };
  }

  // ── Try Gmail SMTP with 10s timeout (prevents frontend from hanging) ───────
  const gmailTransporter = getGmailTransporter();
  if (gmailTransporter) {
    try {
      await withTimeout(
        gmailTransporter.sendMail({
          from: `"AlumniConnect AI" <${process.env.GMAIL_USER}>`,
          to: email,
          subject,
          html,
        }),
        10000,
        'Gmail SMTP timed out after 10 s. SMTP may be blocked on this server. Set RESEND_API_KEY as an alternative.'
      );
      console.log(`[EmailService] OTP sent via Gmail SMTP to ${email}`);
      return { delivered: true };
    } catch (err) {
      // Surface the error clearly (auth failure, timeout, etc.)
      console.error('[EmailService] Gmail SMTP error:', err.message);
      throw err;
    }
  }

  // ── Fallback: no email provider configured ────────────────────────────────
  console.warn(`[EmailService] No email provider configured. OTP for ${email}: ${otp}`);
  return { delivered: false, otp };
};

/**
 * Verify an OTP for a given email (MongoDB lookup).
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

  await OtpVerification.deleteOne({ email: key }); // single-use
  return { valid: true };
};
