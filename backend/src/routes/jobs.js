/**
 * Job Routes
 */
const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  updateApplicantStatus,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getJobs);
router.get('/:id', protect, getJobById);
router.post('/', protect, authorize('alumni', 'admin'), createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.post('/:id/apply', protect, applyToJob);
router.put('/:id/applicants/:userId', protect, updateApplicantStatus);

module.exports = router;
