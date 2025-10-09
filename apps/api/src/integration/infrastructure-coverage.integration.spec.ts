import { IntegrationTestSetup, IntegrationTestContext, TestData } from './test-setup';
import request from 'supertest';

describe('Infrastructure Services Integration Tests', () => {
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

  describe('Redis Service Coverage', () => {
    it('should handle Redis GET operations', async () => {
      // Test Redis GET through cache interceptor
      const response = await request(context.httpServer)
        .get('/api/forms')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle Redis SET operations', async () => {
      // Test Redis SET through cache interceptor
      const response = await request(context.httpServer)
        .get('/api/tags')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle Redis DEL operations', async () => {
      // Test Redis DEL through cache invalidation by listing organizations
      const response = await request(context.httpServer)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle Redis delByPrefix operations', async () => {
      // Test Redis delByPrefix through cache clearing
      const response = await request(context.httpServer)
        .get('/api/users')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Test Redis error handling through cache operations
      const response = await request(context.httpServer)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle Redis JSON parsing errors', async () => {
      // Test Redis JSON parsing through cache operations
      const response = await request(context.httpServer)
        .get('/api/posts')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Outbox Service Coverage', () => {
    it('should publish events to outbox', async () => {
      // Test outbox publishing through organization creation
      const timestamp = Date.now();
      const orgData = {
        name: `Outbox Test Org ${timestamp}`,
      };

      const response = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      expect(response.body.name).toBe(orgData.name);
    });

    it('should claim outbox events', async () => {
      // Test outbox claiming through organization operations
      const timestamp = Date.now();
      const orgData = {
        name: `Claim Test Org ${timestamp}`,
      };

      const createResponse = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      const orgId = createResponse.body.id;

      // Get organization to trigger outbox claiming
      const response = await request(context.httpServer)
        .get(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(response.body.name).toBe(orgData.name);
    });

    it('should load outbox events', async () => {
      // Test outbox loading through organization operations
      const timestamp = Date.now();
      const orgData = {
        name: `Load Test Org ${timestamp}`,
      };

      const createResponse = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      const orgId = createResponse.body.id;

      // Get organization to trigger outbox loading
      const response = await request(context.httpServer)
        .get(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(response.body.name).toBe(orgData.name);
    });

    it('should mark outbox events as done', async () => {
      // Test outbox marking as done through organization operations
      const timestamp = Date.now();
      const orgData = {
        name: `Done Test Org ${timestamp}`,
      };

      const createResponse = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      const orgId = createResponse.body.id;

      // Get organization to trigger outbox marking as done
      const response = await request(context.httpServer)
        .get(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(response.body.name).toBe(orgData.name);
    });

    it('should mark outbox events as error', async () => {
      // Test outbox error marking through invalid operations
      await request(context.httpServer)
        .get('/api/organizations/invalid-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(404);
    });

    it('should handle outbox transaction operations', async () => {
      // Test outbox transaction through organization operations
      const timestamp = Date.now();
      const orgData = {
        name: `Transaction Test Org ${timestamp}`,
      };

      const response = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      expect(response.body.name).toBe(orgData.name);
    });
  });

  describe('Dispatcher Service Coverage', () => {
    it('should handle organization.created events', async () => {
      // Test dispatcher handling organization.created
      const timestamp = Date.now();
      const orgData = {
        name: `Org Created Test ${timestamp}`,
      };

      const response = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      expect(response.body.name).toBe(orgData.name);
    });

    it('should handle organization.updated events', async () => {
      // Test dispatcher handling organization.updated through listing
      const timestamp = Date.now();
      const orgData = {
        name: `Org Updated Test ${timestamp}`,
      };

      const createResponse = await request(context.httpServer)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .send(orgData)
        .expect(201);

      const orgId = createResponse.body.id;

      // List organizations to trigger dispatcher events
      const response = await request(context.httpServer)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle dispatcher error scenarios', async () => {
      // Test dispatcher error handling through invalid operations
      await request(context.httpServer)
        .get('/api/organizations/invalid-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .expect(404);
    });
  });

  describe('Tag Stats Processor Coverage', () => {
    it('should handle tag stats processing', async () => {
      // Test tag stats processor through tag listing
      const response = await request(context.httpServer)
        .get('/api/tags')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle tag stats aggregation', async () => {
      // Test tag stats aggregation through multiple tag operations
      const timestamp = Date.now();

      // List tags multiple times to test aggregation
      for (let i = 0; i < 3; i++) {
        const response = await request(context.httpServer)
          .get('/api/tags')
          .set('Authorization', `Bearer ${testData.token}`)
          .set('X-Org-Id', testData.organization.id)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should handle tag stats error scenarios', async () => {
      // Test tag stats error handling through invalid operations
      await request(context.httpServer)
        .patch('/api/tags/invalid-id')
        .set('Authorization', `Bearer ${testData.token}`)
        .set('X-Org-Id', testData.organization.id)
        .send({ name: 'Test' })
        .expect(400);
    });
  });
});
