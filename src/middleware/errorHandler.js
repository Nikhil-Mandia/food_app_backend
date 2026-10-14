const DB_UNAVAILABLE = new Set(['MongoNetworkError', 'MongoServerSelectionError', 'MongooseServerSelectionError']);

function toHttpError(err) {
  if (err.type === 'entity.parse.failed') return { status: 400, message: 'Invalid JSON body' };
  if (err.name === 'CastError') return { status: 400, message: 'Invalid id' };
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {})
      .map((e) => e.message)
      .filter(Boolean);
    return { status: 400, message: details.join(', ') || 'Validation failed' };
  }
  if (err.code === 11000) return { status: 409, message: 'A record with that value already exists' };
  if (DB_UNAVAILABLE.has(err.name)) return { status: 503, message: 'Database is temporarily unavailable' };
  if (typeof err.status === 'number') return { status: err.status, message: err.message };
  return { status: 500, message: 'Internal server error' };
}

const notFound = (req, res) => res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });

const errorHandler = (err, req, res, next) => {
  const { status, message } = toHttpError(err);
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal server error' : message });
};

module.exports = { notFound, errorHandler };
