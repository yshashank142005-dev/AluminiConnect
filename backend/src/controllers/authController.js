/**
 * Auth Controller — Register, Login, Get Me
 */
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, graduationYear, department, skills, careerInterests, company, currentRole, industry, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      graduationYear,
      department,
      skills: skills || [],
      careerInterests: careerInterests || [],
      company,
      currentRole,
      industry,
      location,
      // Alumni require verification
      isVerified: role === 'admin' ? true : role === 'alumni' ? false : true,
      engagementScore: 10, // Welcome bonus
    });

    // Welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Welcome to AlumniConnect AI! 🎉',
      message: `Welcome ${name}! Complete your profile to get personalized career guidance and connect with ${role === 'alumni' ? 'students' : 'alumni mentors'}.`,
      link: '/profile',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to email for verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const result = await emailService.sendOtp(email);
    if (result.delivered) {
      return res.json({ success: true, message: `OTP sent to ${email}` });
    }

    // Email service not configured — OTP is in backend logs (dev/fallback mode)
    return res.json({
      success: true,
      message: 'OTP generated. Check the backend logs for the verification code (email service not configured).',
    });
  } catch (error) {
    // Gmail auth failure (now caught because sendMail is properly awaited)
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return res.status(503).json({
        success: false,
        message: 'Gmail authentication failed. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set correctly in Render environment variables.',
      });
    }
    console.error('[sendOtp] Error:', error.message);
    return res.status(503).json({ success: false, message: error.message || 'Failed to send OTP. Check email configuration.' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    // verifyOtp is now async (MongoDB lookup)
    const result = await emailService.verifyOtp(email, otp);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('[verifyOtp] Error:', error.message);
    next(error);
  }
};


// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last seen
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
