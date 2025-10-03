import { IntegrationTestSetup, IntegrationTestContext, TestData } from './test-setup';
import request from 'supertest';

describe('CRUD Integration Tests', () => {
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

    describe('Forms CRUD', () => {
        it('should create, read, update, and delete forms', async () => {
            const timestamp = Date.now();

            // Create form
            const createData = {
                name: `Test Form ${timestamp}`,
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', title: 'Name' },
                        email: { type: 'string', title: 'Email' }
                    }
                }
            };

            const createResponse = await request(context.httpServer)
                .post('/api/forms')
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `form-create-${timestamp}`)
                .send(createData)
                .expect(201);

            const formId = createResponse.body.id;
            expect(createResponse.body.name).toBe(createData.name);

            // Read form
            const readResponse = await request(context.httpServer)
                .get(`/api/forms/${formId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(200);

            expect(readResponse.body.name).toBe(createData.name);

            // Update form
            const updateData = {
                name: `Updated Form ${timestamp}`,
                schema: createData.schema
            };

            const updateResponse = await request(context.httpServer)
                .patch(`/api/forms/${formId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `form-update-${timestamp}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.name).toBe(updateData.name);

            // Delete form
            await request(context.httpServer)
                .delete(`/api/forms/${formId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `form-delete-${timestamp}`)
                .expect(200);

            // Verify deletion
            await request(context.httpServer)
                .get(`/api/forms/${formId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(404);
        });
    });

    describe('Posts CRUD', () => {
        it('should create, read, update, and delete posts', async () => {
            const timestamp = Date.now();

            // Create post
            const createData = {
                title: `Test Post ${timestamp}`,
                content: 'This is test content',
                tagIds: []
            };

            const createResponse = await request(context.httpServer)
                .post('/api/posts')
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `post-create-${timestamp}`)
                .send(createData)
                .expect(201);

            const postId = createResponse.body.id;
            expect(createResponse.body.title).toBe(createData.title);

            // Read post
            const readResponse = await request(context.httpServer)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(200);

            expect(readResponse.body.title).toBe(createData.title);

            // Update post
            const updateData = {
                version: 1,
                title: `Updated Post ${timestamp}`,
                content: 'Updated content',
                tagIds: []
            };

            const updateResponse = await request(context.httpServer)
                .patch(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `post-update-${timestamp}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.title).toBe(updateData.title);

            // Delete post
            await request(context.httpServer)
                .delete(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `post-delete-${timestamp}`)
                .expect(200);

            // Verify deletion
            await request(context.httpServer)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(404);
        });
    });

    describe('Tags CRUD', () => {
        it('should create, read, update, and delete tags', async () => {
            const timestamp = Date.now();

            // Create tag
            const createData = {
                name: `Test Tag ${timestamp}`
            };

            const createResponse = await request(context.httpServer)
                .post('/api/tags')
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `tag-create-${timestamp}`)
                .send(createData)
                .expect(201);

            const tagId = createResponse.body.id;
            expect(createResponse.body.name).toBe(createData.name);

            // Read tag
            const readResponse = await request(context.httpServer)
                .get('/api/tags')
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(200);

            expect(readResponse.body).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: createData.name })
            ]));

            // Update tag
            const updateData = {
                name: `Updated Tag ${timestamp}`
            };

            const updateResponse = await request(context.httpServer)
                .patch(`/api/tags/${tagId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `tag-update-${timestamp}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.name).toBe(updateData.name);

            // Delete tag
            await request(context.httpServer)
                .delete(`/api/tags/${tagId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `tag-delete-${timestamp}`)
                .expect(200);

            // Verify deletion
            await request(context.httpServer)
                .get(`/api/tags/${tagId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(404);
        });
    });

    describe('Comments CRUD', () => {
        it('should create, read, update, and delete comments', async () => {
            const timestamp = Date.now();

            // First create a post to comment on
            const postData = {
                title: `Post for Comments ${timestamp}`,
                content: 'Post content',
                tagIds: []
            };

            const postResponse = await request(context.httpServer)
                .post('/api/posts')
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `post-for-comments-${timestamp}`)
                .send(postData)
                .expect(201);

            const postId = postResponse.body.id;

            // Create comment
            const createData = {
                content: `Test Comment ${timestamp}`
            };

            const createResponse = await request(context.httpServer)
                .post(`/api/posts/${postId}/comments`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `comment-create-${timestamp}`)
                .send(createData)
                .expect(201);

            const commentId = createResponse.body.id;
            expect(createResponse.body.content).toBe(createData.content);

            // Read comment (list comments for the post)
            const readResponse = await request(context.httpServer)
                .get(`/api/posts/${postId}/comments`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(200);

            expect(readResponse.body).toEqual(expect.arrayContaining([
                expect.objectContaining({ content: createData.content })
            ]));

            // Update comment
            const updateData = {
                content: `Updated Comment ${timestamp}`
            };

            const updateResponse = await request(context.httpServer)
                .patch(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `comment-update-${timestamp}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.content).toBe(updateData.content);

            // Delete comment
            await request(context.httpServer)
                .delete(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .set('Idempotency-Key', `comment-delete-${timestamp}`)
                .expect(200);

            // Verify deletion
            await request(context.httpServer)
                .get(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .set('X-Org-Id', testData.organization.id)
                .expect(404);
        });
    });

    describe('Database cleanup', () => {
        it('should handle database cleanup correctly', async () => {
            const timestamp = Date.now();

            // Create test data
            const org = await context.prisma.organization.create({
                data: {
                    id: `cleanup-test-org-${timestamp}`,
                    name: `Cleanup Test Org ${timestamp}`,
                },
            });

            // Verify it exists
            const foundOrg = await context.prisma.organization.findUnique({
                where: { id: org.id }
            });
            expect(foundOrg).toBeTruthy();

            // Run cleanup
            await IntegrationTestSetup.cleanupTestData(context);

            // Verify it's gone
            const deletedOrg = await context.prisma.organization.findUnique({
                where: { id: org.id }
            });
            expect(deletedOrg).toBeNull();
        });
    });
});
