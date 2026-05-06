/**
 * AI Controller — Career path, chatbot, icebreakers, daily coach, digital twin
 */
const User = require('../models/User');
const fs = require('fs/promises');
const path = require('path');
const aiService = require('../services/aiService');
const { getTopMatches } = require('../utils/matchingAlgorithm');
const { MAX_CV_BYTES, MIN_VIDEO_CONTEXT_CHARS } = require('../utils/cvReviewSchema');

let mammoth = null;
let pdfParse = null;
try {
  mammoth = require('mammoth');
} catch (_e) {}
try {
  pdfParse = require('pdf-parse');
} catch (_e) {}

// In-memory daily coach cache (resets on server restart, refreshes daily)
const dailyCoachCache = new Map();

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

// @desc    Get daily personalized coaching action
// @route   GET /api/ai/daily-coach
// @access  Private
exports.getDailyCoach = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${req.user.id}:${today}`;

    // Return cached tip if already generated today
    if (dailyCoachCache.has(cacheKey)) {
      return res.json({ success: true, data: dailyCoachCache.get(cacheKey), cached: true });
    }

    const tip = await aiService.generateDailyCoach({
      name: user.name,
      role: user.role,
      skills: user.skills,
      careerInterests: user.careerInterests,
      goals: user.goals,
      engagementScore: user.engagementScore,
      connections: user.connections,
      badges: user.badges,
      department: user.department,
    });

    // Cache for this user today
    dailyCoachCache.set(cacheKey, tip);

    // Clean up old cache entries (keep memory lean)
    for (const [key] of dailyCoachCache) {
      if (!key.endsWith(today)) dailyCoachCache.delete(key);
    }

    // Award a small XP nudge for checking coach daily
    await user.addEngagement(1);

    res.json({ success: true, data: tip, cached: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Get 7-day digital twin projection
// @route   GET /api/ai/digital-twin
// @access  Private
exports.getDigitalTwin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const twin = aiService.generateDigitalTwin({
      name:            user.name,
      role:            user.role,
      engagementScore: user.engagementScore,
      connections:     user.connections,
      badges:          user.badges,
      skills:          user.skills,
      careerInterests: user.careerInterests,
      goals:           user.goals,
      bio:             user.bio,
      profilePhoto:    user.profilePhoto,
      department:      user.department,
      graduationYear:  user.graduationYear,
      createdAt:       user.createdAt,
      lastSeen:        user.lastSeen,
    });

    res.json({ success: true, data: twin });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Career GPS snapshot
// @route   POST /api/ai/career-gps
// @access  Private
exports.getCareerGps = async (req, res, next) => {
  try {
    const { targetRole = '' } = req.body;
    const user = await User.findById(req.user.id).populate('connections', 'name role company currentRole');

    const allAlumni = await User.find({
      role: 'alumni',
      isActive: true,
      isAvailableForMentorship: true,
    }).select('name profilePhoto currentRole company industry skills yearsOfExperience isVerified isAvailableForMentorship');

    const topMatches = getTopMatches(user, allAlumni, 3);
    const mentors = topMatches.map((m) => ({
      id: m.alumni._id,
      name: m.alumni.name,
      profilePhoto: m.alumni.profilePhoto,
      currentRole: m.alumni.currentRole,
      company: m.alumni.company,
      industry: m.alumni.industry,
      yearsOfExperience: m.alumni.yearsOfExperience,
      match: m.score,
      reason: `Strong fit via ${m.breakdown.skills}% skill overlap and ${m.breakdown.industry}% industry alignment.`,
      commonSkills: m.commonSkills || [],
    }));

    const gps = await aiService.generateCareerGps({
      targetRole,
      name: user.name,
      role: user.role,
      skills: user.skills,
      interests: user.careerInterests,
      goals: user.goals,
      profile: {
        bio: user.bio,
        department: user.department,
        graduationYear: user.graduationYear,
        linkedIn: user.linkedIn,
        github: user.github,
        website: user.website,
        profilePhoto: user.profilePhoto,
      },
      engagementScore: user.engagementScore,
      connectionsCount: user.connections?.length || 0,
      mentors,
    });

    await user.addEngagement(3);
    res.json({ success: true, data: gps });
  } catch (error) {
    next(error);
  }
};

const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (_e) {}
};

const readCvText = async (file) => {
  if (!file?.path) return '';
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (ext === '.txt') {
    return fs.readFile(file.path, 'utf8');
  }
  if (ext === '.docx' && mammoth) {
    const result = await mammoth.extractRawText({ path: file.path });
    return result.value || '';
  }
  if (ext === '.pdf' && pdfParse) {
    const data = await fs.readFile(file.path);
    const parsed = await pdfParse(data);
    return parsed.text || '';
  }

  // Fallback when parser dependency is unavailable for binary formats.
  return '';
};

// @desc    Analyze uploaded CV
// @route   POST /api/ai/cv-review
// @access  Private
exports.reviewCv = async (req, res, next) => {
  const filePath = req.file?.path;
  try {
    const user = await User.findById(req.user.id);
    const targetRole = (req.body.targetRole || '').trim();

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CV file is required' });
    }
    if (req.file.size > MAX_CV_BYTES) {
      return res.status(400).json({ success: false, message: 'File exceeds 10MB upload limit' });
    }

    const cvText = (await readCvText(req.file)).trim();
    if (!cvText) {
      return res.status(400).json({
        success: false,
        message: 'Unable to extract CV text. Upload a readable TXT/PDF/DOCX file.',
      });
    }

    const data = await aiService.analyzeCv({
      cvText,
      targetRole,
      userProfile: {
        name: user.name,
        role: user.role,
        skills: user.skills || [],
        interests: user.careerInterests || [],
        goals: user.goals || '',
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  } finally {
    await safeUnlink(filePath);
  }
};

// @desc    Analyze video CV from context
// @route   POST /api/ai/video-cv-review
// @access  Private
exports.reviewVideoCv = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const {
      videoUrl = '',
      transcript = '',
      summary = '',
      targetRole = '',
    } = req.body;

    const cleanUrl = videoUrl.trim();
    const cleanTranscript = transcript.trim();
    const cleanSummary = summary.trim();
    const contextLength = (cleanTranscript + cleanSummary).trim().length;

    if (!cleanUrl) {
      return res.status(400).json({ success: false, message: 'Video link is required' });
    }
    try {
      const parsed = new URL(cleanUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch (_e) {
      return res.status(400).json({ success: false, message: 'Provide a valid video URL' });
    }

    if (contextLength < MIN_VIDEO_CONTEXT_CHARS) {
      return res.status(400).json({
        success: false,
        message: `Transcript/summary must have at least ${MIN_VIDEO_CONTEXT_CHARS} characters combined`,
      });
    }

    const data = await aiService.analyzeVideoCv({
      videoUrl: cleanUrl,
      transcript: cleanTranscript,
      summary: cleanSummary,
      targetRole: targetRole.trim(),
      userProfile: {
        name: user.name,
        role: user.role,
        skills: user.skills || [],
        interests: user.careerInterests || [],
        goals: user.goals || '',
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
