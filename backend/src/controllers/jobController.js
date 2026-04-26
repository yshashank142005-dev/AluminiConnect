/**
 * Job Controller — Job postings & referrals
 */
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getJobs = async (req, res, next) => {
  try {
    const { type, skills, referral, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (type) query.jobType = type;
    if (referral === 'true') query.offersReferral = true;
    if (skills) {
      const arr = skills.split(',').map(s => s.trim());
      query.skills = { $in: arr.map(s => new RegExp(s, 'i')) };
    }
    if (search) {
      const r = new RegExp(search, 'i');
      query.$or = [{ title: r }, { company: r }, { description: r }];
    }
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('postedBy', 'name profilePhoto company currentRole')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, jobs, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
};

exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name profilePhoto company currentRole linkedIn')
      .populate('applicants.user', 'name profilePhoto department skills');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) { next(error); }
};

exports.createJob = async (req, res, next) => {
  try {
    const { title, company, description, requirements, skills, location, jobType, salary, experience, offersReferral, applicationDeadline, applyLink } = req.body;
    if (!title || !company || !description) {
      return res.status(400).json({ success: false, message: 'title, company, and description are required' });
    }
    const job = await Job.create({
      title, company, description, requirements, skills: skills || [],
      location: location || 'Remote',
      jobType: jobType || 'full-time',
      salary, experience,
      offersReferral: offersReferral || false,
      applicationDeadline, applyLink,
      postedBy: req.user.id,
    });
    const poster = await User.findById(req.user.id);
    await poster.addEngagement(20);
    const populated = await Job.findById(job._id).populate('postedBy', 'name profilePhoto company currentRole');
    res.status(201).json({ success: true, job: populated });
  } catch (error) { next(error); }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const allowed = ['title', 'company', 'description', 'requirements', 'skills', 'location', 'jobType', 'salary', 'experience', 'offersReferral', 'applicationDeadline', 'applyLink', 'isActive'];
    allowed.forEach(f => { if (req.body[f] !== undefined) job[f] = req.body[f]; });
    await job.save();
    res.json({ success: true, job });
  } catch (error) { next(error); }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) { next(error); }
};

exports.applyToJob = async (req, res, next) => {
  try {
    const { coverLetter } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const alreadyApplied = job.applicants.some(a => a.user.toString() === req.user.id);
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied' });
    }
    job.applicants.push({ user: req.user.id, coverLetter: coverLetter || '' });
    await job.save();

    const applicant = await User.findById(req.user.id);
    await applicant.addEngagement(10);

    // Notify poster
    await Notification.create({
      recipient: job.postedBy,
      sender: req.user.id,
      type: 'job_application',
      title: 'New Job Application',
      message: `${applicant.name} applied to your posting: ${job.title}`,
      link: `/jobs/${job._id}`,
    });

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (error) { next(error); }
};

exports.updateApplicantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['applied', 'reviewing', 'shortlisted', 'rejected', 'offered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const applicant = job.applicants.find(a => a.user.toString() === req.params.userId);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
    applicant.status = status;
    await job.save();

    // Notify applicant if shortlisted or offered
    if (['shortlisted', 'offered'].includes(status)) {
      await Notification.create({
        recipient: req.params.userId,
        type: 'job_update',
        title: status === 'offered' ? '🎉 Job Offer!' : '⭐ You\'ve been shortlisted!',
        message: `Your application for ${job.title} at ${job.company} has been updated to: ${status}`,
        link: `/jobs/${job._id}`,
      });
    }
    res.json({ success: true, message: 'Applicant status updated' });
  } catch (error) { next(error); }
};
