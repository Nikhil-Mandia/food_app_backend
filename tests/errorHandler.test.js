const HttpError = require('../src/utils/HttpError');
const { errorHandler } = require('../src/middleware/errorHandler');

function run(err) {
  const res = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  errorHandler(err, {}, res, () => {});
  return res;
}

describe('errorHandler', () => {
  it('keeps an HttpError status and message', () => {
    const res = run(new HttpError(404, 'Order not found'));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Order not found' });
  });

  it('maps a bad id and validation errors to 400', () => {
    expect(run(Object.assign(new Error('bad'), { name: 'CastError' })).statusCode).toBe(400);
    const invalid = Object.assign(new Error('invalid'), {
      name: 'ValidationError',
      errors: { name: { message: 'Path `name` is required' } },
    });
    expect(run(invalid).body.message).toBe('Path `name` is required');
  });

  it('maps a duplicate key to 409 and hides unexpected failures', () => {
    expect(run(Object.assign(new Error('dup'), { code: 11000 })).statusCode).toBe(409);
    const res = run(new Error('secret stack detail'));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error' });
  });
});
