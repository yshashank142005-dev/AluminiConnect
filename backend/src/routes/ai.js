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
  compareCvVersions,
  generateCvInterviewQuestions,
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
router.post('/cv-compare', protect, cvUpload.fields([{ name: 'oldCv', maxCount: 1 }, { name: 'newCv', maxCount: 1 }]), compareCvVersions);
router.post('/cv-interview-questions', protect, cvUpload.single('cv'), generateCvInterviewQuestions);

module.exports = router;

