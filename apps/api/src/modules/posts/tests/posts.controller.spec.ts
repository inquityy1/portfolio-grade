import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../posts.controller';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RedisService } from '../../../infra/services/redis.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('PostsController', () => {
    let controller: PostsController;
    let mockPostsService: jest.Mocked<PostsService>;

    const mockPrisma = {
        post: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
        tag: { count: jest.fn() },
        membership: { findUnique: jest.fn() },
        postTag: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
        tagAggregate: { upsert: jest.fn(), updateMany: jest.fn() },
        revision: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
    };

    const mockRedis = { delByPrefix: jest.fn() };
    const mockOutbox = { publish: jest.fn() };
    const mockPreview = { enqueue: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostsController],
            providers: [
                PostsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RedisService, useValue: mockRedis },
                { provide: OutboxService, useValue: mockOutbox },
                { provide: PostPreviewProcessor, useValue: mockPreview },
                { provide: RolesGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: RateLimitService, useValue: { hit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }) } },
            ],
        }).compile();

        controller = module.get<PostsController>(PostsController);
        mockPostsService = module.get(PostsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('list', () => {
        it('should list posts with default parameters', async () => {
            const orgId = 'org-123';
            const expectedResult = {
                items: [
                    {
                        id: 'post-1',
                        title: 'Post 1',
                        content: 'Content 1',
                        version: 1,
                        createdAt: new Date('2024-01-15T10:30:00Z'),
                        updatedAt: new Date('2024-01-15T10:30:00Z'),
                        author: { name: 'Author 1' },
                        postTags: [{ tag: { id: 'tag-1', name: 'Tag 1' } }],
                    },
                ],
                nextCursor: null,
            };

            jest.spyOn(mockPostsService, 'list').mockResolvedValue(expectedResult as any);

            const result = await controller.list(orgId);

            expect(mockPostsService.list).toHaveBeenCalledWith(orgId, {
                limit: undefined,
                cursor: null,
                q: null,
                tagId: null,
                includeFileAssets: false,
            });
            expect(result).toEqual(expectedResult);
        });

        it('should list posts with query parameters', async () => {
            const orgId = 'org-123';
            const limit = '20';
            const cursor = 'cursor-123';
            const q = 'search term';
            const tagId = 'tag-123';
            const includeFileAssets = 'true';

            const expectedResult = {
                items: [],
                nextCursor: null,
            };

            jest.spyOn(mockPostsService, 'list').mockResolvedValue(expectedResult);

            const result = await controller.list(orgId, limit, cursor, q, tagId, includeFileAssets);

            expect(mockPostsService.list).toHaveBeenCalledWith(orgId, {
                limit: 20,
                cursor: 'cursor-123',
                q: 'search term',
                tagId: 'tag-123',
                includeFileAssets: true,
            });
            expect(result).toEqual(expectedResult);
        });

        it('should handle string parameters correctly', async () => {
            const orgId = 'org-123';
            const limit = 'invalid';
            const includeFileAssets = 'false';

            const expectedResult = { items: [], nextCursor: null };
            jest.spyOn(mockPostsService, 'list').mockResolvedValue(expectedResult);

            const result = await controller.list(orgId, limit, undefined, undefined, undefined, includeFileAssets);

            expect(mockPostsService.list).toHaveBeenCalledWith(orgId, {
                limit: NaN, // Invalid number becomes NaN
                cursor: null,
                q: null,
                tagId: null,
                includeFileAssets: false,
            });
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getOne', () => {
        it('should get a post by id', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const expectedPost = {
                id: postId,
                title: 'Post Title',
                content: 'Post Content',
                version: 1,
                organizationId: orgId,
                authorId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                postTags: [{ postId: postId, tagId: 'tag-1', tag: { id: 'tag-1', name: 'Tag 1', organizationId: orgId } }],
                revisions: [{ id: 'rev-1', version: 1, content: 'Post Content', createdAt: new Date(), postId }],
            };

            jest.spyOn(mockPostsService, 'getOne').mockResolvedValue(expectedPost);

            const result = await controller.getOne(orgId, postId);

            expect(mockPostsService.getOne).toHaveBeenCalledWith(orgId, postId);
            expect(result).toEqual(expectedPost);
        });
    });

    describe('create', () => {
        it('should create a new post', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const createDto = {
                title: 'New Post',
                content: 'New content',
                tagIds: ['tag-1', 'tag-2'],
            };

            const expectedPost = {
                id: 'post-123',
                title: 'New Post',
                content: 'New content',
                version: 1,
                organizationId: orgId,
                authorId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                postTags: [{ postId: 'post-123', tagId: 'tag-1', tag: { id: 'tag-1', name: 'Tag 1', organizationId: orgId } }],
                revisions: [{ id: 'rev-1', version: 1, content: 'New content', createdAt: new Date(), postId: 'post-123' }],
            };

            const req = { user: { userId } };

            jest.spyOn(mockPostsService, 'create').mockResolvedValue(expectedPost);

            const result = await controller.create(orgId, req, createDto);

            expect(mockPostsService.create).toHaveBeenCalledWith(orgId, userId, createDto);
            expect(result).toEqual(expectedPost);
        });
    });

    describe('update', () => {
        it('should update a post', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const userId = 'user-123';
            const updateDto = {
                version: 1,
                title: 'Updated Title',
                content: 'Updated content',
                tagIds: ['tag-1', 'tag-2'],
            };

            const expectedPost = {
                id: postId,
                title: 'Updated Title',
                content: 'Updated content',
                version: 2,
                organizationId: orgId,
                authorId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                postTags: [{ postId: postId, tagId: 'tag-1', tag: { id: 'tag-1', name: 'Tag 1', organizationId: orgId } }],
                revisions: [{ id: 'rev-2', version: 2, content: 'Updated content', createdAt: new Date(), postId }],
            };

            const req = { user: { userId } };

            jest.spyOn(mockPostsService, 'update').mockResolvedValue(expectedPost);

            const result = await controller.update(orgId, req, postId, updateDto);

            expect(mockPostsService.update).toHaveBeenCalledWith(orgId, postId, userId, updateDto);
            expect(result).toEqual(expectedPost);
        });
    });

    describe('remove', () => {
        it('should remove a post', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const userId = 'user-123';

            const expectedResult = { ok: true };

            const req = { user: { userId } };

            jest.spyOn(mockPostsService, 'remove').mockResolvedValue(expectedResult);

            const result = await controller.remove(orgId, postId, req);

            expect(mockPostsService.remove).toHaveBeenCalledWith(orgId, postId, userId);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('listRevisions', () => {
        it('should list post revisions', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const expectedRevisions = [
                { version: 2, createdAt: new Date('2024-01-16T10:30:00Z') },
                { version: 1, createdAt: new Date('2024-01-15T10:30:00Z') },
            ];

            jest.spyOn(mockPostsService, 'listRevisions').mockResolvedValue(expectedRevisions);

            const result = await controller.listRevisions(orgId, postId);

            expect(mockPostsService.listRevisions).toHaveBeenCalledWith(orgId, postId);
            expect(result).toEqual(expectedRevisions);
        });
    });

    describe('getRevision', () => {
        it('should get a specific revision', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const version = '1';
            const expectedRevision = {
                postId,
                version: 1,
                content: 'Revision content',
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockPostsService, 'getRevision').mockResolvedValue(expectedRevision);

            const result = await controller.getRevision(orgId, postId, version);

            expect(mockPostsService.getRevision).toHaveBeenCalledWith(orgId, postId, 1);
            expect(result).toEqual(expectedRevision);
        });
    });

    describe('rollback', () => {
        it('should rollback to a specific revision', async () => {
            const orgId = 'org-123';
            const postId = 'post-123';
            const userId = 'user-123';
            const version = '1';

            const expectedPost = {
                id: postId,
                title: 'Post Title',
                content: 'Rollback content',
                version: 4,
                organizationId: orgId,
                authorId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                postTags: [],
                revisions: [{ id: 'rev-4', version: 4, content: 'Rollback content', createdAt: new Date(), postId }],
            };

            const req = { user: { userId } };

            jest.spyOn(mockPostsService, 'rollbackToRevision').mockResolvedValue(expectedPost);

            const result = await controller.rollback(orgId, req, postId, version);

            expect(mockPostsService.rollbackToRevision).toHaveBeenCalledWith(orgId, postId, userId, 1);
            expect(result).toEqual(expectedPost);
        });
    });

    describe('Controller Metadata', () => {
        it('should have controller methods defined', () => {
            expect(typeof controller.list).toBe('function');
            expect(typeof controller.getOne).toBe('function');
            expect(typeof controller.create).toBe('function');
            expect(typeof controller.update).toBe('function');
            expect(typeof controller.remove).toBe('function');
            expect(typeof controller.listRevisions).toBe('function');
            expect(typeof controller.getRevision).toBe('function');
            expect(typeof controller.rollback).toBe('function');
        });
    });
});
