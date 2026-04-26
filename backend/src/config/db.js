/**
 * MongoDB Connection Configuration
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/alumniconnect';
  const isAtlas = uri.includes('mongodb+srv');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('─────────────────────────────────────────');
    if (!isAtlas) {
      console.error('📋 FIX OPTIONS:');
      console.error('');
      console.error('Option 1 — MongoDB Atlas (Recommended, Free):');
      console.error('  1. Go to https://cloud.mongodb.com and create a free account');
      console.error('  2. Create a free M0 cluster');
      console.error('  3. Click "Connect" → "Drivers" → copy the connection string');
      console.error('  4. Update MONGO_URI in backend/.env:');
      console.error('     MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/alumniconnect');
      console.error('');
      console.error('Option 2 — Install MongoDB locally:');
      console.error('  https://www.mongodb.com/try/download/community');
      console.error('  Then run: net start MongoDB (Windows)');
    }
    console.error('─────────────────────────────────────────\n');
    process.exit(1);
  }
};

module.exports = connectDB;
