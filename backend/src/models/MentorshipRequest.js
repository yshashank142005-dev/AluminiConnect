/**
 * MentorshipRequest Model
 */
const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    goals: {
      type: String,
      default: '',
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String, // e.g., "14:00"
    },
    duration: {
      type: Number, // minutes
      default: 60,
    },
    meetingLink: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    // Match score calculated during request creation
    matchScore: {
      type: Number,
      default: 0,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
