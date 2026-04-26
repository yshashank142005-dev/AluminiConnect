/**
 * Message Controller — Real-time private messaging
 */
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'recipientId and content are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

    // Room ID: sorted IDs joined to ensure same room for both directions
    const roomId = [req.user.id, recipientId].sort().join('_');

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      content: content.trim(),
      roomId,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto role')
      .populate('recipient', 'name profilePhoto role');

    // Emit via Socket.IO for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('message:receive', populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    // Get last message for each unique conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) },
            { recipient: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRead', false] },
                    { $eq: ['$recipient', require('mongoose').Types.ObjectId.createFromHexString(req.user.id)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate partner info
    const mongoose = require('mongoose');
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const msg = conv.lastMessage;
        const partnerId =
          msg.sender.toString() === req.user.id ? msg.recipient : msg.sender;
        const partner = await User.findById(partnerId).select('name profilePhoto role company currentRole lastSeen');
        return {
          roomId: conv._id,
          partner,
          lastMessage: msg,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json({ success: true, conversations: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const roomId = [req.user.id, req.params.userId].sort().join('_');

    const messages = await Message.find({ roomId })
      .populate('sender', 'name profilePhoto role')
      .sort({ createdAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Message.countDocuments({ roomId });

    res.json({ success: true, messages, total, roomId });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages from a user as read
// @route   PUT /api/messages/:userId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const roomId = [req.user.id, req.params.userId].sort().join('_');

    await Message.updateMany(
      { roomId, recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
