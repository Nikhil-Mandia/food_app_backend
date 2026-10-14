const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const { canTransition, canCancel } = require('../constants/orderStatus');
const { scheduleProgress } = require('../services/statusSimulator');
const { publishOrder, subscribeOrder, isTerminalStatus } = require('../services/orderEvents');

exports.createOrder = asyncHandler(async (req, res) => {
  const { customer, items } = req.validated.body;
  const menu = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) }, available: true }).lean();
  const byId = new Map(menu.map((m) => [String(m._id), m]));

  const lines = items.map(({ menuItemId, quantity }) => {
    const m = byId.get(menuItemId);
    if (!m) throw new HttpError(400, `Menu item ${menuItemId} does not exist or is unavailable`);
    return { menuItem: m._id, name: m.name, price: m.price, quantity };
  });
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const order = await Order.create({ customer, items: lines, total });
  scheduleProgress(order._id);
  res.status(201).json(order);
});

// READ one
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.validated.params.id).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json(order);
});

// READ many - order history. Client sends the ids it stored; we never expose "all orders".
exports.getOrdersByIds = asyncHandler(async (req, res) => {
  const orders = await Order.find({ _id: { $in: req.validated.query.ids } }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// UPDATE status - only one step forward at a time.
exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.validated.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  const { status } = req.validated.body;
  if (!canTransition(order.status, status)) {
    throw new HttpError(409, `Cannot move order from ${order.status} to ${status}`);
  }
  order.status = status;
  await order.save();
  publishOrder(order);
  res.json(order);
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.validated.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (!canCancel(order.status)) throw new HttpError(409, 'Order can no longer be cancelled');
  order.status = 'CANCELLED';
  await order.save();
  publishOrder(order);
  res.json(order);
});

exports.streamOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.validated.params.id).lean();
  if (!order) throw new HttpError(404, 'Order not found');

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  let closed = false;
  let unsubscribe = () => {};
  const heartbeat = setInterval(() => {
    if (!closed) res.write(': ping\n\n');
  }, 15000);
  heartbeat.unref();

  await new Promise((resolve) => {
    const finish = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      if (!res.writableEnded) res.end();
      resolve();
    };

    const send = (payload) => {
      if (closed) return;
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      if (isTerminalStatus(payload.status)) finish();
    };

    unsubscribe = subscribeOrder(order._id, send);
    res.on('close', finish);
    send(order);
  });
});
