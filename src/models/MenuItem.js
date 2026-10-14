const { Schema, model } = require('mongoose');

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, 
    image: { type: String, required: true },
    category: { type: String, default: 'Main' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('MenuItem', menuItemSchema);
