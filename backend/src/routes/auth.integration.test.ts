import request from 'supertest';
import app from '../app';

describe('Auth Integration Tests', () => {
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'parent',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('POST /api/auth/register', () => {
    it('should create a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: testUser.email,
        role: testUser.role,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });
      expect(res.body.user).toHaveProperty('id');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body).toHaveProperty('error', 'Email already registered');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: testUser.email,
        role: testUser.role,
      });
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
