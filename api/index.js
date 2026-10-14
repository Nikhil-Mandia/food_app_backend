const express = require('express');
const createApp = require('../src/app');
const connectDB = require('../src/config/db');

const app = express();

app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB(process.env.MONGODB_URI);
    next();
  } catch (err) {
    console.error(err.message);
    res.status(503).json({ message: 'Database is temporarily unavailable' });
  }
});

app.use(createApp());

module.exports = app;
