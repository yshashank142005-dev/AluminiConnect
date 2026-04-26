/**
 * Notification Model
 */
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'mentorship_request',
        'mentorship_accepted',
        'mentorship_declined',
        'new_message',
        'event_reminder',
        'job_application',
        'connection_request',
        'connection_accepted',
        'job_update',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // Frontend route to navigate to
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed }, // Extra data
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
