/**
 * AlumniConnect AI — Main Server Entry Point
 * Express + Socket.IO + MongoDB
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const alumniRoutes = require('./src/routes/alumni');
const aiRoutes = require('./src/routes/ai');
const mentorshipRoutes = require('./src/routes/mentorship');
const messageRoutes = require('./src/routes/messages');
const eventRoutes = require('./src/routes/events');
const jobRoutes = require('./src/routes/jobs');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admin');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'AlumniConnect AI' });
});

// ─── Socket.IO Real-time Events ──────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins with their userId
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`👤 User online: ${userId}`);
  });

  // Join private chat room
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
  });

  // Send message in room
  socket.on('message:send', (data) => {
    // data: { roomId, message (object with sender, content, etc.) }
    socket.to(data.roomId).emit('message:receive', data.message);
  });

  // Typing indicator
  socket.on('typing:start', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing:start', { userId });
  });
  socket.on('typing:stop', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing:stop', { userId });
  });

  // Mentorship request notification
  socket.on('mentorship:request', ({ recipientId, request }) => {
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      io.to(recipientSocket).emit('notification:new', {
        type: 'mentorship_request',
        data: request,
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`❌ User offline: ${socket.userId}`);
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 AlumniConnect AI Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
  console.log(`🤖 AI: ${process.env.OPENAI_API_KEY ? 'OpenAI Connected' : 'Mock Mode (no API key)'}\n`);
});

module.exports = { app, server, io };
