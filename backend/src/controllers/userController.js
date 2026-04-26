/**
 * User Controller — Profile management
 */
const User = require('../models/User');

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
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.connections.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }

    if (!targetUser.connectionRequests.includes(req.user.id)) {
      targetUser.connectionRequests.push(req.user.id);
      await targetUser.save();
    }

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

    // Remove from requests, add to connections (both ways)
    currentUser.connectionRequests = currentUser.connectionRequests.filter(id => id.toString() !== req.params.id);
    if (!currentUser.connections.includes(req.params.id)) currentUser.connections.push(req.params.id);
    if (!requester.connections.includes(req.user.id)) requester.connections.push(req.user.id);

    await Promise.all([currentUser.save(), requester.save()]);

    // Engagement points
    await currentUser.addEngagement(5);
    await requester.addEngagement(5);

    res.json({ success: true, message: 'Connection accepted' });
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
