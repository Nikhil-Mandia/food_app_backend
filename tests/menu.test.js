const request = require('supertest');
const createApp = require('../src/app');
const db = require('./helpers/db');
const MenuItem = require('../src/models/MenuItem');

const app = createApp();
beforeAll(db.connect);
afterAll(db.close);
beforeEach(db.clear);

describe('GET /api/menu', () => {
  it('returns an empty array when the menu is not seeded', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 503 when the database query fails', async () => {
    const spy = jest.spyOn(MenuItem, 'find').mockReturnValue({
      sort: () => ({
        lean: () => Promise.reject(Object.assign(new Error('connection closed'), { name: 'MongoNetworkError' })),
      }),
    });
    try {
      const res = await request(app).get('/api/menu');
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ message: 'Database is temporarily unavailable' });
    } finally {
      spy.mockRestore();
    }
  });

  it('returns only available items with all required fields', async () => {
    await MenuItem.create([
      { name: 'Pizza', description: 'Cheesy', price: 300, image: 'a.jpg' },
      { name: 'Hidden', description: 'Sold out', price: 100, image: 'b.jpg', available: false },
    ]);
    const res = await request(app).get('/api/menu');
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Pizza', description: 'Cheesy', price: 300, image: 'a.jpg' });
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
