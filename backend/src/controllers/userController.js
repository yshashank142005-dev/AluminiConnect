/**
 * User Controller — Profile management
 */
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('connections', 'name profilePhoto role company currentRole');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'bio', 'graduationYear', 'department', 'skills', 'careerInterests',
      'currentRole', 'company', 'industry', 'location', 'linkedIn', 'github',
      'website', 'goals', 'profilePhoto', 'yearsOfExperience', 'isAvailableForMentorship',
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Give engagement points for completing profile
    if (updateData.bio && updateData.skills?.length > 0) {
      await user.addEngagement(10);
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Send connection request
// @route   POST /api/users/connect/:id
// @access  Private
exports.sendConnectionRequest = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.connections.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }

    if (targetUser.connectionRequests.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Connection request already sent' });
    }

    targetUser.connectionRequests.push(req.user.id);
    await targetUser.save();

    const sender = await User.findById(req.user.id).select('name');
    await Notification.create({
      recipient: targetUser._id,
      sender: req.user.id,
      type: 'connection_request',
      title: 'New connection request 🤝',
      message: `${sender?.name || 'Someone'} sent you a connection request.`,
      link: '/alumni',
      data: { senderId: req.user.id },
    });

    res.json({ success: true, message: 'Connection request sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept connection request
// @route   PUT /api/users/connect/:id/accept
// @access  Private
exports.acceptConnection = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(req.params.id);

    if (!requester) return res.status(404).json({ success: false, message: 'User not found' });
    if (!currentUser.connectionRequests.some(id => id.toString() === req.params.id)) {
      return res.status(400).json({ success: false, message: 'No pending request from this user' });
    }

    // Remove from requests, add to connections (both ways)
    currentUser.connectionRequests = currentUser.connectionRequests.filter(id => id.toString() !== req.params.id);
    if (!currentUser.connections.some(id => id.toString() === req.params.id)) currentUser.connections.push(req.params.id);
    if (!requester.connections.some(id => id.toString() === req.user.id)) requester.connections.push(req.user.id);

    await Promise.all([currentUser.save(), requester.save()]);

    // Engagement points
    await currentUser.addEngagement(5);
    await requester.addEngagement(5);

    await Notification.create({
      recipient: requester._id,
      sender: req.user.id,
      type: 'connection_accepted',
      title: 'Connection accepted ✅',
      message: `${currentUser.name} accepted your connection request.`,
      link: `/messages/${req.user.id}`,
      data: { acceptedBy: req.user.id },
    });

    res.json({ success: true, message: 'Connection accepted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending connection requests for current user
// @route   GET /api/users/connect/requests
// @access  Private
exports.getConnectionRequests = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('connectionRequests', 'name profilePhoto role currentRole company industry isVerified');

    res.json({
      success: true,
      requests: currentUser?.connectionRequests || [],
      count: currentUser?.connectionRequests?.length || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('name profilePhoto role company currentRole engagementScore badges skills')
      .sort({ engagementScore: -1 })
      .limit(50);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Fetch user with password field (normally excluded)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
