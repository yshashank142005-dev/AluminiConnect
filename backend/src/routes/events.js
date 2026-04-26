/**
 * Event Routes
 */
const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, authorize('alumni', 'admin'), createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/rsvp', protect, rsvpEvent);

module.exports = router;
