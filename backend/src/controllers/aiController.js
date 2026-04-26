/**
 * AI Controller — Career path, chatbot, icebreakers
 */
const User = require('../models/User');
const aiService = require('../services/aiService');

// @desc    Generate personalized career path
// @route   POST /api/ai/career-path
// @access  Private
exports.generateCareerPath = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const {
      skills = user.skills || [],
      interests = user.careerInterests || [],
      goals = user.goals || '',
      timeline = '6 months',
    } = req.body;

    const result = await aiService.generateCareerPath({ skills, interests, goals, timeline });

    // Award engagement points for using AI feature
    await user.addEngagement(5);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Career chatbot
// @route   POST /api/ai/chat
// @access  Private
exports.chatbot = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const reply = await aiService.chatbotReply(message.trim(), history, {
      name: user.name,
      role: user.role,
      department: user.department,
      skills: user.skills,
      careerInterests: user.careerInterests,
    });

    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI icebreaker for connecting two users
// @route   POST /api/ai/icebreaker
// @access  Private
exports.generateIcebreaker = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required' });
    }

    const [user1, user2] = await Promise.all([
      User.findById(req.user.id),
      User.findById(targetUserId),
    ]);

    if (!user2) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const icebreaker = await aiService.generateIcebreaker(user1, user2);

    res.json({ success: true, icebreaker });
  } catch (error) {
    next(error);
  }
};
