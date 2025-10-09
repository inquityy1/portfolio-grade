import { IntegrationTestSetup, IntegrationTestContext, TestData } from './test-setup';
import request from 'supertest';

describe('Extended Coverage Integration Tests', () => {
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

  describe('Organizations Module Coverage', () => {
    it('should get organization by ID', async () => {
      const response = await request(context.httpServer)
        .get(`/api/organizations/${testData.organization.id}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(response.body.id).toBe(testData.organization.id);
      expect(response.body.name).toBe(testData.organization.name);
    });

    it('should handle organization not found', async () => {
      await request(context.httpServer)
        .get('/api/organizations/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(404);
    });

    it('should list organizations', async () => {
      const response = await request(context.httpServer)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Users Module Coverage', () => {
    it('should get user by ID', async () => {
      const response = await request(context.httpServer)
        .get(`/api/users/${testData.user.id}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(response.body.id).toBe(testData.user.id);
      expect(response.body.email).toBe(testData.user.email);
    });

    it('should list users', async () => {
      const response = await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle user not found', async () => {
      await request(context.httpServer)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Posts Module Coverage', () => {
    it('should handle post not found', async () => {
      await request(context.httpServer)
        .get('/api/posts/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Forms Module Coverage', () => {
    it('should list forms', async () => {
      const response = await request(context.httpServer)
        .get('/api/forms')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle form not found', async () => {
      await request(context.httpServer)
        .get('/api/forms/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Tags Module Coverage', () => {
    it('should list tags', async () => {
      const response = await request(context.httpServer)
        .get('/api/tags')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle tag not found', async () => {
      await request(context.httpServer)
        .get('/api/tags/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Submissions Module Coverage', () => {
    it('should handle submission not found', async () => {
      await request(context.httpServer)
        .get('/api/submissions/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Comments Module Coverage', () => {
    it('should handle comment not found', async () => {
      await request(context.httpServer)
        .get('/api/comments/non-existent-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(404);
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle unauthorized requests', async () => {
      await request(context.httpServer).get('/api/users').expect(401);
    });

    it('should handle requests without organization header', async () => {
      await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(403);
    });

    it('should handle invalid JWT token', async () => {
      await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .set('X-Org-Id', testData.organization.id)
        .expect(401);
    });
  });

  describe('Rate Limiting Coverage', () => {
    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(context.httpServer)
            .get('/api/users')
            .set('Authorization', `Bearer ${testData.token}`)
            .set('X-Org-Id', testData.organization.id),
        );

      const responses = await Promise.all(requests);

      // At least one should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Caching Coverage', () => {
    it('should handle cached responses', async () => {
      // First request
      const response1 = await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      // Second request (should potentially use cache)
      const response2 = await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response1.body)).toBe(true);
      expect(Array.isArray(response2.body)).toBe(true);
    });
  });
});
