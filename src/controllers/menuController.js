const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');

exports.getMenu = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw new HttpError(503, 'Database is temporarily unavailable');
  }

  const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 }).lean();
  res.status(200).json(items);
});
