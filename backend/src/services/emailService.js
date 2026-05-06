/**
 * Email Service — sends OTPs via Resend API (HTTPS, works on Render/cloud)
 *
 * Why Resend instead of Gmail SMTP?
 *   Render (and most cloud providers) block outbound SMTP ports (587/465).
 *   Resend uses HTTPS so it works everywhere.
 *
 * Setup (free, 3 000 emails/month):
 *   1. Sign up at https://resend.com
 *   2. Go to API Keys → Create API Key
 *   3. Add RESEND_API_KEY to Render environment variables
 *
 * OTPs are persisted in MongoDB (OtpVerification collection) with a TTL index
 * so they survive server restarts on Render's free tier.
 */
const { Resend } = require('resend');
const OtpVerification = require('../models/OtpVerification');

const getResend = () => {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key || key === 're_your_api_key_here') {
    console.warn('[EmailService] RESEND_API_KEY not set — falling back to console log mode.');
    return null;
  }
  return new Resend(key);
};

/**
 * Generate a 6-digit OTP, persist it to MongoDB, and email it via Resend.
 * Throws on API failure so the controller can return a meaningful error.
 */
exports.sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const key = email.toLowerCase();

  // Upsert into MongoDB — replace any existing OTP for this email
  await OtpVerification.findOneAndUpdate(
    { email: key },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: 'AlumniConnect AI <onboarding@resend.dev>',
      to: [email],
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

    if (error) {
      console.error('[EmailService] Resend API error:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    console.log(`[EmailService] OTP email sent to ${email} via Resend`);
    return { delivered: true };
  }

  // Fallback: no API key — log OTP for manual use (dev/testing only)
  console.warn(`[EmailService] No RESEND_API_KEY set. OTP for ${email}: ${otp}`);
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
