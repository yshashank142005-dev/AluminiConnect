/**
 * Mentorship Routes
 */
const express = require('express');
const router = express.Router();
const {
  sendRequest,
  getRequests,
  respondToRequest,
  scheduleSession,
  submitFeedback,
  cancelRequest,
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, sendRequest);
router.get('/requests', protect, getRequests);
router.put('/request/:id/respond', protect, respondToRequest);
router.put('/request/:id/schedule', protect, scheduleSession);
router.post('/request/:id/feedback', protect, submitFeedback);
router.put('/request/:id/cancel', protect, cancelRequest);

module.exports = router;
