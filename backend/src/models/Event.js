/**
 * Event Model — Webinars, reunions, networking events
 */
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['webinar', 'reunion', 'networking', 'workshop', 'career_fair', 'other'],
      default: 'webinar',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String, // "18:00"
      required: [true, 'Event time is required'],
    },
    duration: {
      type: Number, // minutes
      default: 60,
    },
    venue: {
      type: String,
      default: 'Online',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
    maxAttendees: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    rsvpList: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rsvpedAt: { type: Date, default: Date.now },
      },
    ],
    isPublished: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: attendee count
EventSchema.virtual('attendeeCount').get(function () {
  return this.rsvpList.length;
});

module.exports = mongoose.model('Event', EventSchema);
