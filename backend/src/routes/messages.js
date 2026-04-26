/**
 * Message Routes
 */
const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
