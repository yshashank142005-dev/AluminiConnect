/**
 * OtpVerification Model
 * Stores email verification OTPs in MongoDB so they survive server restarts.
 * A TTL index automatically removes expired records after 10 minutes.
 */
const mongoose = require('mongoose');

const OtpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: MongoDB auto-deletes this document after 600 seconds (10 min)
  },
});

module.exports = mongoose.model('OtpVerification', OtpVerificationSchema);
