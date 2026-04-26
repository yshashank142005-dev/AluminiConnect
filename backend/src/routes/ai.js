/**
 * AI Routes
 */
const express = require('express');
const router = express.Router();
const {
  generateCareerPath,
  chatbot,
  generateIcebreaker,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/career-path', protect, generateCareerPath);
router.post('/chat', protect, chatbot);
router.post('/icebreaker', protect, generateIcebreaker);

module.exports = router;
