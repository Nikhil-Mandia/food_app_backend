const Order = require('../models/Order');
const { FLOW } = require('../constants/orderStatus');
const { publishOrder } = require('./orderEvents');

const STEP_MS = Number(process.env.STATUS_STEP_MS) || 8000;


function scheduleProgress(orderId) {
  if (process.env.NODE_ENV === 'test') return;
  FLOW.slice(1).forEach((nextStatus, i) => {
    const timer = setTimeout(async () => {
      try {
        const updated = await Order.findOneAndUpdate(
          { _id: orderId, status: FLOW[i] },
          { status: nextStatus },
          { new: true }
        ).lean();
        if (updated) publishOrder(updated);
      } catch (err) {
        console.error('Status simulation failed', err.message);
      }
    }, STEP_MS * (i + 1));
    timer.unref(); 
  });
}

module.exports = { scheduleProgress };
