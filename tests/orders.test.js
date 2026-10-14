const http = require('http');
const request = require('supertest');
const createApp = require('../src/app');
const db = require('./helpers/db');
const MenuItem = require('../src/models/MenuItem');

const app = createApp();
let pizza, burger, soldOut;

const customer = { name: 'Rahul Sharma', address: '12 MG Road, Ghaziabad, UP', phone: '9876543210' };
const body = (over = {}) => ({
  customer,
  items: [{ menuItemId: String(pizza._id), quantity: 2 }, { menuItemId: String(burger._id), quantity: 1 }],
  ...over,
});
const place = (payload = body()) => request(app).post('/api/orders').send(payload);

beforeAll(db.connect);
afterAll(db.close);
beforeEach(async () => {
  await db.clear();
  [pizza, burger, soldOut] = await MenuItem.create([
    { name: 'Pizza', description: 'd', price: 300, image: 'p.jpg' },
    { name: 'Burger', description: 'd', price: 200, image: 'b.jpg' },
    { name: 'Gone', description: 'd', price: 50, image: 'g.jpg', available: false },
  ]);
});

describe('POST /api/orders (create)', () => {
  it('creates an order, computes the total on the server and starts as RECEIVED', async () => {
    const res = await place();
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(800); // 2*300 + 200
    expect(res.body.status).toBe('RECEIVED');
    expect(res.body.items[0]).toMatchObject({ name: 'Pizza', price: 300, quantity: 2 });
  });

  it('ignores a price sent by the client', async () => {
    const payload = body();
    payload.items[0].price = 1;
    const res = await place(payload);
    expect(res.body.total).toBe(800);
  });

  it.each([
    ['empty cart', { items: [] }],
    ['zero quantity', { items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 0 }] }],
    ['quantity above max', { items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 11 }] }],
    ['bad menu id', { items: [{ menuItemId: 'abc', quantity: 1 }] }],
    ['short name', { customer: { ...customer, name: 'A' } }],
    ['short address', { customer: { ...customer, address: 'short' } }],
    ['invalid phone', { customer: { ...customer, phone: '12345' } }],
  ])('rejects %s with 400', async (_label, override) => {
    const res = await place(body(override));
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects duplicate items', async () => {
    const id = String(pizza._id);
    const res = await place(body({ items: [{ menuItemId: id, quantity: 1 }, { menuItemId: id, quantity: 2 }] }));
    expect(res.status).toBe(400);
  });

  it('rejects unknown or unavailable menu items', async () => {
    const unknown = await place(body({ items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 1 }] }));
    const gone = await place(body({ items: [{ menuItemId: String(soldOut._id), quantity: 1 }] }));
    expect(unknown.status).toBe(400);
    expect(gone.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app).post('/api/orders').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders/:id and GET /api/orders?ids= (read)', () => {
  it('gets an order by id', async () => {
    const { body: created } = await place();
    const res = await request(app).get(`/api/orders/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(created._id);
  });

  it('returns 404 for a missing order and 400 for a malformed id', async () => {
    expect((await request(app).get('/api/orders/507f1f77bcf86cd799439011')).status).toBe(404);
    expect((await request(app).get('/api/orders/not-an-id')).status).toBe(400);
  });

  it('lists order history for the given ids, newest first', async () => {
    const a = (await place()).body;
    const b = (await place()).body;
    await place(); // not requested
    const res = await request(app).get(`/api/orders?ids=${a._id},${b._id}`);
    expect(res.status).toBe(200);
    expect(res.body.map((o) => o._id)).toEqual([b._id, a._id]);
  });

  it('refuses to list orders without ids (no data dump)', async () => {
    expect((await request(app).get('/api/orders')).status).toBe(400);
  });
});

describe('PATCH /api/orders/:id/status (update)', () => {
  it('moves through the lifecycle one step at a time', async () => {
    const { body: o } = await place();
    for (const status of ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
      const res = await request(app).patch(`/api/orders/${o._id}/status`).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('rejects skipping a step or going backwards with 409', async () => {
    const { body: o } = await place();
    const skip = await request(app).patch(`/api/orders/${o._id}/status`).send({ status: 'DELIVERED' });
    expect(skip.status).toBe(409);
    await request(app).patch(`/api/orders/${o._id}/status`).send({ status: 'PREPARING' });
    const back = await request(app).patch(`/api/orders/${o._id}/status`).send({ status: 'PREPARING' });
    expect(back.status).toBe(409);
  });

  it('rejects invalid status values and unknown orders', async () => {
    const { body: o } = await place();
    expect((await request(app).patch(`/api/orders/${o._id}/status`).send({ status: 'FLYING' })).status).toBe(400);
    expect((await request(app).patch('/api/orders/507f1f77bcf86cd799439011/status').send({ status: 'PREPARING' })).status).toBe(404);
  });
});

describe('GET /api/orders/:id/events', () => {
  it('pushes each status change over the event stream', async () => {
    const { body: o } = await place();
    const server = await new Promise((resolve) => {
      const listening = app.listen(0, () => resolve(listening));
    });

    try {
      const events = await new Promise((resolve, reject) => {
        const received = [];
        let settled = false;
        const finish = (err, value) => {
          if (settled) return;
          settled = true;
          req.destroy();
          if (err) reject(err);
          else resolve(value);
        };
        const req = http.get(`http://127.0.0.1:${server.address().port}/api/orders/${o._id}/events`, (res) => {
          let buf = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            buf += chunk;
            let splitAt;
            while ((splitAt = buf.indexOf('\n\n')) !== -1) {
              const block = buf.slice(0, splitAt);
              buf = buf.slice(splitAt + 2);
              const line = block.split('\n').find((entry) => entry.startsWith('data: '));
              if (!line) continue;
              received.push(JSON.parse(line.slice(6)));
              if (received.length === 1) {
                request(app)
                  .patch(`/api/orders/${o._id}/status`)
                  .send({ status: 'PREPARING' })
                  .end((err) => {
                    if (err) finish(err);
                  });
              }
              if (received.length === 2) finish(null, received);
            }
          });
        });
        req.on('error', (err) => {
          if (!settled && err.code !== 'ECONNRESET') finish(err);
        });
      });

      expect(events.map((event) => event.status)).toEqual(['RECEIVED', 'PREPARING']);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('DELETE /api/orders/:id (cancel)', () => {
  it('cancels an order that has not started', async () => {
    const { body: o } = await place();
    const res = await request(app).delete(`/api/orders/${o._id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('cannot cancel once preparing', async () => {
    const { body: o } = await place();
    await request(app).patch(`/api/orders/${o._id}/status`).send({ status: 'PREPARING' });
    expect((await request(app).delete(`/api/orders/${o._id}`)).status).toBe(409);
  });
});
