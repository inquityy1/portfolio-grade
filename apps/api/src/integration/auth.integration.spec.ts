import { IntegrationTestSetup, IntegrationTestContext, TestData } from './test-setup';
import request from 'supertest';

describe('Auth Integration Tests', () => {
  let context: IntegrationTestContext;
  let testData: TestData;

  beforeAll(async () => {
    context = await IntegrationTestSetup.createTestApp();
    testData = await IntegrationTestSetup.seedTestData(context);
  });

  afterAll(async () => {
    await IntegrationTestSetup.cleanupTestData(context);
    await context.app.close();
  });

  describe('POST /auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const loginData = {
        email: testData.user.email,
        password: 'testpassword123',
      };

      const response = await request(context.httpServer)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: testData.user.email,
        password: 'wrongpassword',
      };

      await request(context.httpServer).post('/api/auth/login').send(loginData).expect(401);
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(context.httpServer).post('/api/auth/login').send(loginData).expect(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const timestamp = Date.now();
      const registerData = {
        email: `newuser${timestamp}@example.com`,
        password: 'newpassword123',
        name: `New User ${timestamp}`,
      };

      const response = await request(context.httpServer)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body.email).toBe(registerData.email);
      expect(response.body.name).toBe(registerData.name);
    });

    it('should reject duplicate email', async () => {
      const registerData = {
        email: testData.user.email, // Already exists
        password: 'password123',
        name: 'Duplicate User',
      };

      await request(context.httpServer).post('/api/auth/register').send(registerData).expect(409);
    });

    it('should validate required fields', async () => {
      const registerData = {
        email: 'incomplete@example.com',
        // Missing password and name
      };

      await request(context.httpServer).post('/api/auth/register').send(registerData).expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      const response = await request(context.httpServer)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testData.user.email);
    });

    it('should reject invalid token', async () => {
      await request(context.httpServer)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject missing token', async () => {
      await request(context.httpServer).get('/api/auth/me').expect(401);
    });
  });
});
