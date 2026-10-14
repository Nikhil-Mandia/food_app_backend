const { EventEmitter } = require('events');

const TERMINAL = new Set(['DELIVERED', 'CANCELLED']);
const bus = new EventEmitter();
bus.setMaxListeners(0);

function publishOrder(order) {
  const plain = order && typeof order.toObject === 'function' ? order.toObject() : order;
  if (!plain?._id) return;
  bus.emit(String(plain._id), plain);
}

function subscribeOrder(orderId, listener) {
  const key = String(orderId);
  bus.on(key, listener);
  return () => bus.off(key, listener);
}

const isTerminalStatus = (status) => TERMINAL.has(status);

module.exports = { publishOrder, subscribeOrder, isTerminalStatus };
