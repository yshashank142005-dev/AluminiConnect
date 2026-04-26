/**
 * Alumni Routes
 */
const express = require('express');
const router = express.Router();
const {
  getAlumni,
  getAlumniById,
  getMyMatches,
  searchAlumni,
} = require('../controllers/alumniController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAlumni);
router.get('/search', protect, searchAlumni);
router.get('/matches', protect, getMyMatches);
router.get('/:id', protect, getAlumniById);

module.exports = router;
