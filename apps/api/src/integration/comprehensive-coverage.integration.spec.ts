import { IntegrationTestSetup, IntegrationTestContext, TestData } from './test-setup';
import request from 'supertest';

describe('Comprehensive Coverage Integration Tests', () => {
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

  describe('Audit Logs Service Coverage', () => {
    it('should list audit logs with all filters', async () => {
      const response = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({
          resource: 'User',
          action: 'CREATE',
          from: '2024-01-01T00:00:00Z',
          to: '2024-12-31T23:59:59Z',
          take: 50,
          cursor: 'test-cursor',
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should list audit logs with resource filter only', async () => {
      const response = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ resource: 'Post' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should list audit logs with action filter only', async () => {
      const response = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ action: 'UPDATE' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should list audit logs with date range filter', async () => {
      const response = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({
          from: '2024-01-01T00:00:00Z',
          to: '2024-12-31T23:59:59Z',
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid date format gracefully', async () => {
      const response = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({
          from: 'invalid-date',
          to: 'invalid-date',
        })
        .expect(500); // Expect 500 error for invalid dates

      expect(response.body).toBeDefined();
    });

    it('should handle take parameter limits', async () => {
      // Test minimum limit
      const response1 = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ take: 0 })
        .expect(200);

      // Test maximum limit
      const response2 = await request(context.httpServer)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ take: 200 })
        .expect(200);

      expect(Array.isArray(response1.body)).toBe(true);
      expect(Array.isArray(response2.body)).toBe(true);
    });
  });

  describe('Posts Service Comprehensive Coverage', () => {
    it('should list posts with search query', async () => {
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ q: 'test search' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should list posts with limit parameter', async () => {
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should list posts with cursor pagination', async () => {
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ cursor: 'test-cursor-id' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should list posts with tag filter', async () => {
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ tagId: 'test-tag-id' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should list posts with includeFileAssets', async () => {
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .query({ includeFileAssets: true })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Users Service Comprehensive Coverage', () => {
    it('should handle user creation with invalid email format', async () => {
      const userData = {
        email: 'invalid-email-format',
        password: 'password123',
        name: 'Test User',
      };

      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(userData)
        .expect(400);
    });

    it('should handle user creation with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(userData)
        .expect(400);
    });

    it('should handle user creation with empty name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: '',
      };

      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(userData)
        .expect(400);
    });

    it('should handle user creation with invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'InvalidRole',
      };

      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(userData)
        .expect(400);
    });

    it('should handle user update with invalid email', async () => {
      const updateData = {
        email: 'invalid-email',
      };

      await request(context.httpServer)
        .patch(`/api/users/${testData.user.id}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(updateData)
        .expect(400);
    });

    it('should handle user update with invalid role', async () => {
      const updateData = {
        role: 'InvalidRole',
      };

      await request(context.httpServer)
        .patch(`/api/users/${testData.user.id}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(updateData)
        .expect(400);
    });
  });

  describe('Organizations Service Comprehensive Coverage', () => {
    it('should create organization with minimal name', async () => {
      const timestamp = Date.now();
      const orgData = {
        name: `Minimal Org ${timestamp}`,
      };

      const response = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      expect(response.body.name).toBe(orgData.name);
      expect(response.body.id).toBeDefined();
    });

    it('should handle organization creation with duplicate name', async () => {
      const orgData = {
        name: testData.organization.name, // Use existing organization name
      };

      await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(409); // Conflict
    });

    it('should handle organization creation with case-insensitive duplicate name', async () => {
      const orgData = {
        name: testData.organization.name.toUpperCase(), // Same name, different case
      };

      await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(409); // Conflict
    });

    it('should handle organization creation with empty name', async () => {
      await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send({ name: '' })
        .expect(400);
    });

    it('should handle organization creation with very long name', async () => {
      const longName = 'A'.repeat(1000); // Very long name
      const orgData = {
        name: longName,
      };

      await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(400);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send('{"email":"test@example.com"}')
        .expect(400);
    });

    it('should handle oversized request body', async () => {
      const largeData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A'.repeat(10000), // Very large name
      };

      await request(context.httpServer)
        .post('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send(largeData)
        .expect(400);
    });
  });
});
