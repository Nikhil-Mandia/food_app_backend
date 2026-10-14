const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (mongoose.connection.readyState === 1) return;
  if (!global.__mongoConnect) {
    global.__mongoConnect = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  try {
    await global.__mongoConnect;
  } catch (err) {
    global.__mongoConnect = null;
    throw err;
  }
  console.log('MongoDB connected');
}

module.exports = connectDB;
