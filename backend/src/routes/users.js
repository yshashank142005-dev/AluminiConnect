/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUsers,
  sendConnectionRequest,
  acceptConnection,
  getConnectionRequests,
  getLeaderboard,
  changePassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/profile/:id', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/connect/requests', protect, getConnectionRequests);
router.post('/connect/:id', protect, sendConnectionRequest);
router.put('/connect/:id/accept', protect, acceptConnection);

module.exports = router;
