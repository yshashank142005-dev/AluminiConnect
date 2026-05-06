/**
 * Email Service — OTP delivery
 *
 * Provider priority:
 *   1. Brevo REST API  (set BREVO_API_KEY)
 *      Uses HTTPS port 443 — NEVER blocked by cloud providers like Render.
 *      Free: 300 emails/day, sends to ANY address, no domain verification.
 *   2. Gmail SMTP (set GMAIL_USER + GMAIL_APP_PASSWORD) — local dev fallback only
 *   3. Console log — no provider configured
 *
 * OTPs are persisted in MongoDB (OtpVerification) with a TTL index
 * so they survive server restarts on Render's free tier.
 *
 * NOTE: BREVO_API_KEY is the same key as BREVO_SMTP_KEY — Brevo uses one key
 * for both SMTP and REST API. Just rename the env var on Render.
 */
const https = require('https');
const nodemailer = require('nodemailer');
const OtpVerification = require('../models/OtpVerification');

// ─── Brevo REST API sender ────────────────────────────────────────────────────

/**
 * Sends an email via Brevo's HTTPS REST API.
 * Uses Node's built-in `https` — zero extra dependencies.
 */
const sendViaBrevoApi = (to, subject, html) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '').trim();
  if (!apiKey) return null; // not configured

  const body = JSON.stringify({
    sender: { name: 'AlumniConnect AI', email: process.env.BREVO_USER || 'noreply@alumniconnect.app' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true });
          } else {
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Brevo API request timed out after 15s'));
    });
    req.write(body);
    req.end();
  });
};

// ─── Gmail SMTP transporter (local dev fallback) ──────────────────────────────
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

const withTimeout = (promise, ms, msg) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);

// ─── OTP Email HTML template ─────────────────────────────────────────────────
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a 6-digit OTP, persist to MongoDB, then email it.
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

  // ── 1. Try Brevo REST API (HTTPS port 443 — works on ALL cloud platforms) ──
  const apiKey = (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '').trim();
  if (apiKey) {
    try {
      await sendViaBrevoApi(email, subject, html);
      console.log(`[EmailService] OTP sent via Brevo API to ${email}`);
      return { delivered: true };
    } catch (err) {
      console.error('[EmailService] Brevo API error:', err.message);
      throw err; // Surface error — don't silently fall to Gmail on Render
    }
  }

  // ── 2. Gmail SMTP (local dev only — often blocked on cloud) ────────────────
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
        'Gmail SMTP timed out after 10s. SMTP may be blocked on this server. Set BREVO_API_KEY.'
      );
      console.log(`[EmailService] OTP sent via Gmail SMTP to ${email}`);
      return { delivered: true };
    } catch (err) {
      console.error('[EmailService] Gmail SMTP error:', err.message);
      throw err;
    }
  }

  // ── 3. No provider configured ──────────────────────────────────────────────
  console.warn(`[EmailService] No email provider configured. OTP for ${email}: ${otp}`);
  return { delivered: false, otp };
};

/**
 * Verify an OTP for a given email.
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

  await OtpVerification.deleteOne({ email: key });
  return { valid: true };
};
