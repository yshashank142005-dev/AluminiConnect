/**
 * Job Model — Job postings and referrals by alumni
 */
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: {
      type: String,
      default: '',
    },
    skills: [{ type: String }],
    location: {
      type: String,
      default: 'Remote',
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
      default: 'full-time',
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    experience: {
      type: String,
      default: '0-2 years',
    },
    offersReferral: {
      type: Boolean,
      default: false,
    },
    applicationDeadline: {
      type: Date,
    },
    applyLink: {
      type: String,
      default: '',
    },
    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['applied', 'reviewing', 'shortlisted', 'rejected', 'offered'],
          default: 'applied',
        },
        appliedAt: { type: Date, default: Date.now },
        coverLetter: { type: String, default: '' },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: applicant count
JobSchema.virtual('applicantCount').get(function () {
  return this.applicants.length;
});

module.exports = mongoose.model('Job', JobSchema);
