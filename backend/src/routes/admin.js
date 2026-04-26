/**
 * Admin Routes
 */
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  verifyAlumni,
  deactivateUser,
  reactivateUser,
  getPendingVerifications,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/pending-verifications', getPendingVerifications);
router.put('/verify/:id', verifyAlumni);
router.put('/deactivate/:id', deactivateUser);
router.put('/reactivate/:id', reactivateUser);

module.exports = router;
