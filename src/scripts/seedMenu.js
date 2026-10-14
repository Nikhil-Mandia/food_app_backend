
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MenuItem = require('../models/MenuItem');
const menu = require('../data/menu');

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    const force = process.argv.includes('--force');
    const count = await MenuItem.countDocuments();

    if (count > 0 && !force) {
      console.log(`Menu already has ${count} items. Skipping (use --force to reseed).`);
    } else {
      if (force) await MenuItem.deleteMany({});
      await MenuItem.insertMany(menu);
      console.log(`Seeded ${menu.length} menu items.`);
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
