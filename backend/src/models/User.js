/**
 * User Model — Supports Student, Alumni, and Admin roles
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      default: 'student',
    },

    // Profile details
    profilePhoto: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    graduationYear: {
      type: Number,
      min: 1950,
      max: 2035,
    },
    department: {
      type: String,
      default: '',
    },

    // Skills (tag-based)
    skills: [{ type: String, trim: true }],

    // For alumni
    currentRole: { type: String, default: '' },
    company: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false }, // Alumni verification
    isAvailableForMentorship: { type: Boolean, default: true },

    // For students
    careerInterests: [{ type: String, trim: true }],
    goals: { type: String, default: '' },

    // Gamification
    engagementScore: { type: Number, default: 0 },
    badges: [{ type: String }],

    // Connections
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Admin status
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Update engagement score
UserSchema.methods.addEngagement = async function (points) {
  this.engagementScore += points;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
