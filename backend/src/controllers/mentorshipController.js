/**
 * Mentorship Controller — Request, respond, schedule, feedback
 */
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
// @access  Private (student)
exports.sendRequest = async (req, res, next) => {
  try {
    const { alumniId, message, goals } = req.body;

    if (!alumniId || !message) {
      return res.status(400).json({ success: false, message: 'alumniId and message are required' });
    }

    const alumni = await User.findOne({ _id: alumniId, role: 'alumni' });
    if (!alumni) return res.status(404).json({ success: false, message: 'Alumni not found' });

    // Prevent duplicate pending requests
    const existing = await MentorshipRequest.findOne({
      student: req.user.id,
      alumni: alumniId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending request with this alumni' });
    }

    const student = await User.findById(req.user.id);
    const { score } = calculateMatchScore(student, alumni);

    const mentorshipReq = await MentorshipRequest.create({
      student: req.user.id,
      alumni: alumniId,
      message,
      goals: goals || '',
      matchScore: score,
    });

    // Notify alumni
    await Notification.create({
      recipient: alumniId,
      sender: req.user.id,
      type: 'mentorship_request',
      title: 'New Mentorship Request',
      message: `${student.name} has sent you a mentorship request.`,
      link: '/mentorship',
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(alumniId.toString()).emit('notification:new', {
        type: 'mentorship_request',
        title: 'New Mentorship Request',
        message: `${student.name} wants you as a mentor!`,
      });
    }

    await student.addEngagement(10);

    const populated = await MentorshipRequest.findById(mentorshipReq._id)
      .populate('student', 'name profilePhoto department skills careerInterests')
      .populate('alumni', 'name profilePhoto company currentRole');

    res.status(201).json({ success: true, request: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentorship requests (for both student and alumni)
// @route   GET /api/mentorship/requests
// @access  Private
exports.getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (req.user.role === 'alumni') {
      query.alumni = req.user.id;
    } else {
      query.student = req.user.id;
    }

    if (status) query.status = status;

    const requests = await MentorshipRequest.find(query)
      .populate('student', 'name profilePhoto department skills careerInterests bio goals')
      .populate('alumni', 'name profilePhoto company currentRole industry skills bio')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or decline a mentorship request
// @route   PUT /api/mentorship/request/:id/respond
// @access  Private (alumni)
exports.respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' | 'declined'
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or declined' });
    }

    const request = await MentorshipRequest.findOne({
      _id: req.params.id,
      alumni: req.user.id,
    });

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already responded to' });
    }

    request.status = status;
    await request.save();

    const alumni = await User.findById(req.user.id);

    // Notify student
    await Notification.create({
      recipient: request.student,
      sender: req.user.id,
      type: status === 'accepted' ? 'mentorship_accepted' : 'mentorship_declined',
      title: status === 'accepted' ? '🎉 Mentorship Request Accepted!' : 'Mentorship Request Declined',
      message: status === 'accepted'
        ? `${alumni.name} has accepted your mentorship request! You can now schedule a session.`
        : `${alumni.name} has declined your mentorship request.`,
      link: '/mentorship',
    });

    if (status === 'accepted') await alumni.addEngagement(15);

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Schedule a mentorship session
// @route   PUT /api/mentorship/request/:id/schedule
// @access  Private
exports.scheduleSession = async (req, res, next) => {
  try {
    const { scheduledDate, scheduledTime, duration, meetingLink } = req.body;
    const request = await MentorshipRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Request must be accepted before scheduling' });
    }

    // Allow both student and alumni to schedule
    const isParticipant = [request.student.toString(), request.alumni.toString()].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Forbidden' });

    request.scheduledDate = scheduledDate;
    request.scheduledTime = scheduledTime;
    request.duration = duration || 60;
    request.meetingLink = meetingLink || '';
    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback after a session
// @route   POST /api/mentorship/request/:id/feedback
// @access  Private (student)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const request = await MentorshipRequest.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.feedback = { rating, comment: comment || '' };
    request.status = 'completed';
    await request.save();

    // Engagement reward for completion
    const student = await User.findById(req.user.id);
    await student.addEngagement(20);

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a mentorship request
// @route   PUT /api/mentorship/request/:id/cancel
// @access  Private
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const isParticipant = [request.student.toString(), request.alumni.toString()].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Forbidden' });

    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this request' });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ success: true, message: 'Request cancelled', request });
  } catch (error) {
    next(error);
  }
};
