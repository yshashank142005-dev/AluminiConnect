/**
 * Email Service — OTP delivery
 *
 * Provider priority:
 *   1. Brevo SMTP  (set BREVO_USER + BREVO_SMTP_KEY)
 *      - Free: 300 emails/day, NO domain verification needed, sends to ANY address
 *      - Works on Render (HTTPS-based SMTP relay, port 587)
 *   2. Gmail SMTP  (set GMAIL_USER + GMAIL_APP_PASSWORD) ← 10s timeout fallback
 *   3. Console log (dev mode — no provider configured)
 *
 * OTPs are persisted in MongoDB (OtpVerification) with a TTL index
 * so they survive server restarts on Render's free tier.
 */
const nodemailer = require('nodemailer');
const OtpVerification = require('../models/OtpVerification');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Brevo (Sendinblue) SMTP transporter, or null if env vars not set. */
const getBrevoTransporter = () => {
  const user = (process.env.BREVO_USER || '').trim();
  const pass = (process.env.BREVO_SMTP_KEY || '').trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });
};

/** Returns a Gmail SMTP transporter, or null if env vars not set. */
const getGmailTransporter = () => {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
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
 * Generate a 6-digit OTP, persist it to MongoDB, then email it.
 * Tries Brevo first, falls back to Gmail SMTP, then console log.
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

  // ── Try Brevo SMTP (free, no domain needed, works on Render) ──────────────
  const brevoTransporter = getBrevoTransporter();
  if (brevoTransporter) {
    try {
      await withTimeout(
        brevoTransporter.sendMail({
          from: `"AlumniConnect AI" <${process.env.BREVO_USER}>`,
          to: email,
          subject,
          html,
        }),
        15000,
        'Brevo SMTP timed out after 15s.'
      );
      console.log(`[EmailService] OTP sent via Brevo to ${email}`);
      return { delivered: true };
    } catch (err) {
      console.error('[EmailService] Brevo SMTP error:', err.message);
      // Fall through to Gmail
    }
  }

  // ── Try Gmail SMTP with 10s timeout ───────────────────────────────────────
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
        'Gmail SMTP timed out after 10s. SMTP may be blocked on this server.'
      );
      console.log(`[EmailService] OTP sent via Gmail SMTP to ${email}`);
      return { delivered: true };
    } catch (err) {
      console.error('[EmailService] Gmail SMTP error:', err.message);
      throw err; // Surface error to controller
    }
  }

  // ── No provider configured ─────────────────────────────────────────────────
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
