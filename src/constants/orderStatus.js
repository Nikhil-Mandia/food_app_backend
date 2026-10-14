const FLOW = ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const ALL_STATUSES = [...FLOW, 'CANCELLED'];

const canTransition = (from, to) => {
  const i = FLOW.indexOf(from);
  return i >= 0 && FLOW.indexOf(to) === i + 1;
};
const canCancel = (status) => status === 'RECEIVED';

module.exports = { FLOW, ALL_STATUSES, canTransition, canCancel };
