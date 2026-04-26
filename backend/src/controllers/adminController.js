/**
 * Admin Controller — Platform management
 */
const User = require('../models/User');
const Job = require('../models/Job');
const Event = require('../models/Event');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalStudents, totalAlumni, totalJobs, totalEvents, totalMentorships, pendingVerifications] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'alumni', isActive: true }),
      Job.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: true }),
      MentorshipRequest.countDocuments(),
      User.countDocuments({ role: 'alumni', isVerified: false, isActive: true }),
    ]);

    const recentUsers = await User.find({ isActive: true })
      .select('name email role profilePhoto createdAt isVerified')
      .sort({ createdAt: -1 })
      .limit(5);

    const topEngaged = await User.find({ isActive: true })
      .select('name profilePhoto role engagementScore badges')
      .sort({ engagementScore: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: { totalUsers, totalStudents, totalAlumni, totalJobs, totalEvents, totalMentorships, pendingVerifications },
      recentUsers,
      topEngaged,
    });
  } catch (error) { next(error); }
};

exports.getPendingVerifications = async (req, res, next) => {
  try {
    const alumni = await User.find({ role: 'alumni', isVerified: false, isActive: true })
      .select('name email profilePhoto company currentRole industry graduationYear createdAt linkedIn')
      .sort({ createdAt: -1 });
    res.json({ success: true, alumni });
  } catch (error) { next(error); }
};

exports.verifyAlumni = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'alumni' },
      { isVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Alumni not found' });

    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: '✅ Account Verified!',
      message: 'Your alumni account has been verified. You can now post jobs, host events, and mentor students.',
      link: '/profile',
    });

    res.json({ success: true, message: `${user.name} verified successfully`, user });
  } catch (error) { next(error); }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `${user.name} deactivated` });
  } catch (error) { next(error); }
};

exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `${user.name} reactivated` });
  } catch (error) { next(error); }
};
