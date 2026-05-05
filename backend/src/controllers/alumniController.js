/**
 * Alumni Controller — Browse, search, and match alumni mentors
 */
const User = require('../models/User');
const { getTopMatches } = require('../utils/matchingAlgorithm');

// @desc    Get all verified alumni (with filters)
// @route   GET /api/alumni
// @access  Private
exports.getAlumni = async (req, res, next) => {
  try {
    const {
      industry,
      skills,
      mentorship,
      company,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { role: 'alumni', isActive: true };
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (mentorship === 'true') query.isAvailableForMentorship = true;
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }

    const total = await User.countDocuments(query);
    const alumni = await User.find(query)
      .select('name profilePhoto bio currentRole company industry location skills careerInterests yearsOfExperience isVerified isAvailableForMentorship engagementScore lastSeen connectionRequests')
      .sort({ isVerified: -1, engagementScore: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      alumni,
      total,
      pages: Math.ceil(total / Number(limit)),
      page: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single alumni profile
// @route   GET /api/alumni/:id
// @access  Private
exports.getAlumniById = async (req, res, next) => {
  try {
    const alumni = await User.findOne({ _id: req.params.id, role: 'alumni' })
      .populate('connections', 'name profilePhoto role company currentRole');

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }

    res.json({ success: true, alumni });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI-matched alumni for the current student
// @route   GET /api/alumni/matches
// @access  Private
exports.getMyMatches = async (req, res, next) => {
  try {
    const student = await User.findById(req.user.id);

    const allAlumni = await User.find({
      role: 'alumni',
      isActive: true,
    }).select('name profilePhoto bio currentRole company industry location skills careerInterests yearsOfExperience isVerified isAvailableForMentorship engagementScore connectionRequests');

    const matches = getTopMatches(student, allAlumni, 10);

    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
};

// @desc    Search alumni by name / keyword
// @route   GET /api/alumni/search
// @access  Private
exports.searchAlumni = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const alumni = await User.find({
      role: 'alumni',
      isActive: true,
      $or: [
        { name: regex },
        { company: regex },
        { currentRole: regex },
        { industry: regex },
        { skills: regex },
      ],
    })
      .select('name profilePhoto bio currentRole company industry location skills isVerified isAvailableForMentorship connectionRequests')
      .limit(20);

    res.json({ success: true, alumni });
  } catch (error) {
    next(error);
  }
};
