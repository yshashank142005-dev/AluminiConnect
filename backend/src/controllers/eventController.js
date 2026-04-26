/**
 * Event Controller — Campus/virtual events and RSVPs
 * Field mapping: type, venue, meetingLink, rsvpList, isPublished
 */
const Event = require('../models/Event');
const User = require('../models/User');

exports.getEvents = async (req, res, next) => {
  try {
    const { type, upcoming, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };
    if (type) query.type = type;
    if (upcoming === 'true') query.date = { $gte: new Date() };
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name profilePhoto company currentRole')
      .sort({ date: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, events, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name profilePhoto company currentRole')
      .populate('rsvpList.user', 'name profilePhoto role');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) { next(error); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, time, duration, venue, meetingLink, type, tags, maxAttendees, coverImage } = req.body;
    if (!title || !description || !date || !time) {
      return res.status(400).json({ success: false, message: 'title, description, date and time are required' });
    }
    const event = await Event.create({
      title, description, date, time: time || '10:00',
      duration: duration || 60,
      venue: venue || 'Online',
      meetingLink: meetingLink || '',
      type: type || 'webinar',
      tags: tags || [],
      maxAttendees: maxAttendees || 0,
      coverImage: coverImage || '',
      organizer: req.user.id,
    });
    const organizer = await User.findById(req.user.id);
    await organizer.addEngagement(15);
    const populated = await Event.findById(event._id).populate('organizer', 'name profilePhoto company currentRole');
    res.status(201).json({ success: true, event: populated });
  } catch (error) { next(error); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const allowed = ['title', 'description', 'date', 'time', 'duration', 'venue', 'meetingLink', 'type', 'tags', 'maxAttendees', 'coverImage', 'isPublished', 'status'];
    allowed.forEach(f => { if (req.body[f] !== undefined) event[f] = req.body[f]; });
    await event.save();
    res.json({ success: true, event });
  } catch (error) { next(error); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
};

exports.rsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const userId = req.user.id;
    const alreadyRsvped = event.rsvpList.some(r => r.user.toString() === userId);
    if (alreadyRsvped) {
      event.rsvpList = event.rsvpList.filter(r => r.user.toString() !== userId);
      await event.save();
      return res.json({ success: true, attending: false, message: 'RSVP cancelled' });
    }
    if (event.maxAttendees > 0 && event.rsvpList.length >= event.maxAttendees) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }
    event.rsvpList.push({ user: userId });
    await event.save();
    const user = await User.findById(userId);
    await user.addEngagement(5);
    res.json({ success: true, attending: true, message: 'RSVP successful' });
  } catch (error) { next(error); }
};
