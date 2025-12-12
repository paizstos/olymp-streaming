const request = require('supertest');
process.env.ADMIN_GOAL_TOKEN = 'test-token';
const app = require('../app');

describe('API basics', () => {
  it('GET /api/scores/today returns matches', async () => {
    const res = await request(app).get('/api/scores/today');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('matches');
    expect(Array.isArray(res.body.matches)).toBe(true);
  });

  it('POST /admin/goal-rdc then GET /api/goal-rdc returns goal once', async () => {
    await request(app)
      .post('/admin/goal-rdc')
      .set('x-admin-token', 'test-token')
      .expect(204);

    const res = await request(app).get('/api/goal-rdc');
    expect(res.status).toBe(200);
    expect(res.body.goal).toBe(true);
  });
});
