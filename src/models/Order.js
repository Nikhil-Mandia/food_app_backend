const { Schema, model } = require('mongoose');
const { ALL_STATUSES } = require('../constants/orderStatus');

const lineSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customer: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: { type: [lineSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ALL_STATUSES, default: 'RECEIVED', index: true },
  },
  { timestamps: true }
);

module.exports = model('Order', orderSchema);
