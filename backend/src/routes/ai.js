/**
 * AI Routes
 */
const express = require('express');
const router = express.Router();
const {
  generateCareerPath,
  chatbot,
  generateIcebreaker,
  getDailyCoach,
  getDigitalTwin,
  getCareerGps,
  reviewCv,
  reviewVideoCv,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { cvUpload } = require('../middleware/upload');

router.post('/career-path', protect, generateCareerPath);
router.post('/chat', protect, chatbot);
router.post('/icebreaker', protect, generateIcebreaker);
router.get('/daily-coach', protect, getDailyCoach);
router.get('/digital-twin', protect, getDigitalTwin);
router.post('/career-gps', protect, getCareerGps);
router.post('/cv-review', protect, cvUpload.single('cv'), reviewCv);
router.post('/video-cv-review', protect, reviewVideoCv);

module.exports = router;

