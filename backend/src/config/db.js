/**
 * MongoDB Connection Configuration
 */
const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/alumniconnect';
  const isAtlas = uri.includes('mongodb+srv');
  const localUri = 'mongodb://127.0.0.1:27017/alumniconnect';

  try {
    // Some Windows/ISP DNS resolvers fail Atlas SRV lookups in Node (querySrv ECONNREFUSED).
    // Force known public DNS for Atlas connections to make startup reliable.
    if (isAtlas) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('─────────────────────────────────────────');
    console.error(`Reason: ${error.message}`);
    console.error('');
    if (isAtlas) {
      console.error('Atlas troubleshooting:');
      console.error('- Verify internet/DNS access (SRV lookup must work)');
      console.error('- Allow your IP in Atlas Network Access');
      console.error('- Verify MONGO_URI username/password and cluster hostname');
      console.error('');
      console.error('Trying local MongoDB fallback at mongodb://127.0.0.1:27017/alumniconnect ...');
      try {
        const localConn = await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ Fallback MongoDB Connected: ${localConn.connection.host}`);
        return;
      } catch (localError) {
        console.error(`Local fallback failed: ${localError.message}`);
      }
      console.error('');
    }
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
