import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RedisService } from '../../../infra/services/redis.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockOutboxService: jest.Mocked<OutboxService>;
  let mockPreviewProcessor: jest.Mocked<PostPreviewProcessor>;

  beforeEach(async () => {
    const mockPrisma = {
      post: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      tag: {
        count: jest.fn(),
      },
      membership: {
        findUnique: jest.fn(),
      },
      postTag: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      tagAggregate: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      revision: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockRedis = {
      delByPrefix: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    const mockPreview = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: OutboxService, useValue: mockOutbox },
        { provide: PostPreviewProcessor, useValue: mockPreview },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    mockPrismaService = module.get(PrismaService);
    mockRedisService = module.get(RedisService);
    mockOutboxService = module.get(OutboxService);
    mockPreviewProcessor = module.get(PostPreviewProcessor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    const orgId = 'org-123';
    const expectedPosts = [
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
    ];

    beforeEach(() => {
      (mockPrismaService.post.findMany as jest.Mock).mockResolvedValue(expectedPosts);
    });

    it('should list posts with default options', async () => {
      const result = await service.list(orgId);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 11, // default limit + 1
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          content: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
          postTags: { select: { tag: { select: { id: true, name: true } } } },
        },
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should list posts with custom limit', async () => {
      const result = await service.list(orgId, { limit: 20 });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 21, // limit + 1
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should list posts with cursor pagination', async () => {
      const result = await service.list(orgId, { cursor: 'post-123' });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 11,
        cursor: { id: 'post-123' },
        skip: 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should list posts with search query', async () => {
      const result = await service.list(orgId, { q: 'search term' });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          OR: [
            { title: { contains: 'search term', mode: 'insensitive' } },
            { content: { contains: 'search term', mode: 'insensitive' } },
          ],
        },
        take: 11,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should list posts with tag filter', async () => {
      const result = await service.list(orgId, { tagId: 'tag-123' });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          postTags: { some: { tagId: 'tag-123' } },
        },
        take: 11,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should list posts with file assets', async () => {
      const result = await service.list(orgId, { includeFileAssets: true });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 11,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          content: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
          postTags: { select: { tag: { select: { id: true, name: true } } } },
          files: { select: { id: true, url: true, mimeType: true } },
        },
      });
      expect(result).toEqual({ items: expectedPosts, nextCursor: null });
    });

    it('should handle pagination with next cursor', async () => {
      // Create enough items to exceed the default limit (10)
      const manyPosts = Array.from({ length: 11 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        content: `Content ${i}`,
        version: 1,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
        author: { name: `Author ${i}` },
        postTags: [{ tag: { id: `tag-${i}`, name: `Tag ${i}` } }],
      }));

      (mockPrismaService.post.findMany as jest.Mock).mockResolvedValue(manyPosts);

      const result = await service.list(orgId);

      // The service should pop the last item and use it as nextCursor
      // So if we have 11 items from Prisma, we should get 10 items + nextCursor
      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe('post-10');
    });

    it('should enforce maximum limit', async () => {
      const result = await service.list(orgId, { limit: 100 });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 51, // max limit + 1
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
    });

    it('should enforce minimum limit', async () => {
      const result = await service.list(orgId, { limit: 0 });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 2, // min limit + 1
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: expect.any(Object),
      });
    });
  });

  describe('getOne', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const expectedPost = {
      id: postId,
      title: 'Post Title',
      content: 'Post Content',
      version: 1,
      organizationId: orgId,
      postTags: [{ tag: { id: 'tag-1', name: 'Tag 1' } }],
      revisions: [{ version: 1, content: 'Post Content' }],
    };

    beforeEach(() => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue(expectedPost);
    });

    it('should get a post by id', async () => {
      const result = await service.getOne(orgId, postId);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
        include: {
          postTags: { include: { tag: true } },
          revisions: { orderBy: { version: 'desc' }, take: 1 },
        },
      });
      expect(result).toEqual(expectedPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOne(orgId, postId)).rejects.toThrow(NotFoundException);
      await expect(service.getOne(orgId, postId)).rejects.toThrow('Post not found');
    });
  });

  describe('create', () => {
    const orgId = 'org-123';
    const authorId = 'user-123';
    const createData = {
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
      authorId,
      postTags: [{ tag: { id: 'tag-1', name: 'Tag 1' } }],
      revisions: [{ version: 1, content: 'New content' }],
    };

    beforeEach(() => {
      (mockPrismaService.tag.count as jest.Mock).mockResolvedValue(2);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            create: jest.fn().mockResolvedValue(expectedPost),
          },
          tagAggregate: {
            upsert: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });
    });

    it('should create a post successfully', async () => {
      const result = await service.create(orgId, authorId, createData);

      expect(mockPrismaService.tag.count).toHaveBeenCalledWith({
        where: { id: { in: ['tag-1', 'tag-2'] }, organizationId: orgId },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockOutboxService.publish).toHaveBeenCalledWith('post.created', {
        id: expectedPost.id,
        orgId,
      });
      expect(mockPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, expectedPost.id);
      expect(result).toEqual(expectedPost);
    });

    it('should create a post without tags', async () => {
      const dataWithoutTags = { title: 'New Post', content: 'New content' };
      const result = await service.create(orgId, authorId, dataWithoutTags);

      expect(mockPrismaService.tag.count).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedPost);
    });

    it('should throw ForbiddenException when tags do not belong to organization', async () => {
      (mockPrismaService.tag.count as jest.Mock).mockResolvedValue(1); // Only 1 out of 2 tags found

      await expect(service.create(orgId, authorId, createData)).rejects.toThrow(ForbiddenException);
      await expect(service.create(orgId, authorId, createData)).rejects.toThrow(
        'One or more tags do not belong to this organization',
      );
    });

    it('should handle preview processor errors gracefully', async () => {
      mockPreviewProcessor.enqueue.mockRejectedValue(new Error('Preview error'));

      const result = await service.create(orgId, authorId, createData);

      expect(result).toEqual(expectedPost);
      expect(mockPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, expectedPost.id);
    });
  });

  describe('update', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const userId = 'user-123';
    const updateData = {
      version: 1,
      title: 'Updated Title',
      content: 'Updated content',
      tagIds: ['tag-1', 'tag-2'],
    };

    const existingPost = {
      id: postId,
      authorId: userId,
    };

    const membership = {
      role: 'Editor',
    };

    const updatedPost = {
      id: postId,
      title: 'Updated Title',
      content: 'Updated content',
      version: 2,
      organizationId: orgId,
      postTags: [{ tag: { id: 'tag-1', name: 'Tag 1' } }],
      revisions: [{ version: 2, content: 'Updated content' }],
    };

    beforeEach(() => {
      (mockPrismaService.tag.count as jest.Mock).mockResolvedValue(2);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(existingPost),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ version: 2 }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          tag: {
            count: jest.fn().mockResolvedValue(2),
          },
          postTag: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn(),
            deleteMany: jest.fn(),
          },
          tagAggregate: {
            upsert: jest.fn(),
            updateMany: jest.fn(),
          },
          revision: {
            create: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });
    });

    it('should update a post successfully', async () => {
      // Mock the final findFirst call to return the updated post
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(existingPost) // First call for permission check
              .mockResolvedValueOnce(updatedPost), // Second call for final result
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ version: 2 }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          tag: {
            count: jest.fn().mockResolvedValue(2),
          },
          postTag: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn(),
            deleteMany: jest.fn(),
          },
          tagAggregate: {
            upsert: jest.fn(),
            updateMany: jest.fn(),
          },
          revision: {
            create: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });

      const result = await service.update(orgId, postId, userId, updateData);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockOutboxService.publish).toHaveBeenCalledWith('post.updated', { id: postId, orgId });
      expect(mockPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
      expect(result).toEqual(updatedPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw ForbiddenException when user has no membership', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(existingPost),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        'No membership for this organization',
      );
    });

    it('should throw ForbiddenException when user cannot edit post', async () => {
      const viewerMembership = { role: 'Viewer' };
      const otherAuthorPost = { id: postId, authorId: 'other-user' };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(otherAuthorPost),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(viewerMembership),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        'Only the author, Editor, or OrgAdmin can edit this post',
      );
    });

    it('should throw ConflictException on version conflict', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(existingPost),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // No rows updated
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(orgId, postId, userId, updateData)).rejects.toThrow(
        'Version conflict — please refresh and retry',
      );
    });

    it('should allow OrgAdmin to edit any post', async () => {
      const adminMembership = { role: 'OrgAdmin' };
      const otherAuthorPost = { id: postId, authorId: 'other-user' };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(otherAuthorPost)
              .mockResolvedValueOnce(updatedPost),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ version: 2 }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(adminMembership),
          },
          tag: {
            count: jest.fn().mockResolvedValue(2),
          },
          postTag: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn(),
            deleteMany: jest.fn(),
          },
          tagAggregate: {
            upsert: jest.fn(),
            updateMany: jest.fn(),
          },
          revision: {
            create: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });

      const result = await service.update(orgId, postId, userId, updateData);
      expect(result).toEqual(updatedPost);
    });

    it('should allow author to edit their own post', async () => {
      const authorMembership = { role: 'Viewer' }; // Even viewers can edit their own posts

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(existingPost)
              .mockResolvedValueOnce(updatedPost),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ version: 2 }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(authorMembership),
          },
          tag: {
            count: jest.fn().mockResolvedValue(2),
          },
          postTag: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn(),
            deleteMany: jest.fn(),
          },
          tagAggregate: {
            upsert: jest.fn(),
            updateMany: jest.fn(),
          },
          revision: {
            create: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });

      const result = await service.update(orgId, postId, userId, updateData);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('remove', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const userId = 'user-123';

    const existingPost = {
      id: postId,
      authorId: userId,
      postTags: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }],
    };

    const membership = {
      role: 'Editor',
    };

    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(existingPost),
            delete: jest.fn(),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          tagAggregate: {
            updateMany: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });
    });

    it('should remove a post successfully', async () => {
      const result = await service.remove(orgId, postId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockOutboxService.publish).toHaveBeenCalledWith('post.deleted', { id: postId, orgId });
      expect(result).toEqual({ ok: true });
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.remove(orgId, postId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(orgId, postId, userId)).rejects.toThrow('Post not found');
    });

    it('should throw ForbiddenException when user has no membership', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(existingPost),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.remove(orgId, postId, userId)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(orgId, postId, userId)).rejects.toThrow(
        'No membership for this organization',
      );
    });

    it('should throw ForbiddenException when user cannot delete post', async () => {
      const viewerMembership = { role: 'Viewer' };
      const otherAuthorPost = { id: postId, authorId: 'other-user', postTags: [] };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(otherAuthorPost),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(viewerMembership),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.remove(orgId, postId, userId)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(orgId, postId, userId)).rejects.toThrow(
        'Only the author, Editor, or OrgAdmin can delete this post',
      );
    });
  });

  describe('listRevisions', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const expectedRevisions = [
      { version: 2, createdAt: new Date('2024-01-16T10:30:00Z') },
      { version: 1, createdAt: new Date('2024-01-15T10:30:00Z') },
    ];

    beforeEach(() => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue({ id: postId });
      (mockPrismaService.revision.findMany as jest.Mock).mockResolvedValue(expectedRevisions);
    });

    it('should list revisions for a post', async () => {
      const result = await service.listRevisions(orgId, postId);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.revision.findMany).toHaveBeenCalledWith({
        where: { postId },
        orderBy: { version: 'desc' },
        select: { version: true, createdAt: true },
      });
      expect(result).toEqual(expectedRevisions);
    });

    it('should throw NotFoundException when post not found', async () => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listRevisions(orgId, postId)).rejects.toThrow(NotFoundException);
      await expect(service.listRevisions(orgId, postId)).rejects.toThrow('Post not found');
    });
  });

  describe('getRevision', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const version = 1;
    const expectedRevision = {
      postId,
      version,
      content: 'Revision content',
      createdAt: new Date('2024-01-15T10:30:00Z'),
    };

    beforeEach(() => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue({ id: postId });
      (mockPrismaService.revision.findUnique as jest.Mock).mockResolvedValue(expectedRevision);
    });

    it('should get a specific revision', async () => {
      const result = await service.getRevision(orgId, postId, version);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.revision.findUnique).toHaveBeenCalledWith({
        where: { postId_version: { postId, version } },
        select: { postId: true, version: true, content: true, createdAt: true },
      });
      expect(result).toEqual(expectedRevision);
    });

    it('should throw NotFoundException when post not found', async () => {
      (mockPrismaService.post.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getRevision(orgId, postId, version)).rejects.toThrow(NotFoundException);
      await expect(service.getRevision(orgId, postId, version)).rejects.toThrow('Post not found');
    });

    it('should throw NotFoundException when revision not found', async () => {
      (mockPrismaService.revision.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getRevision(orgId, postId, version)).rejects.toThrow(NotFoundException);
      await expect(service.getRevision(orgId, postId, version)).rejects.toThrow(
        'Revision not found',
      );
    });
  });

  describe('rollbackToRevision', () => {
    const orgId = 'org-123';
    const postId = 'post-123';
    const userId = 'user-123';
    const version = 1;

    const post = {
      id: postId,
      authorId: userId,
      version: 3,
    };

    const membership = {
      role: 'Editor',
    };

    const revision = {
      version,
      content: 'Rollback content',
    };

    const rolledBackPost = {
      id: postId,
      title: 'Post Title',
      content: 'Rollback content',
      version: 4,
      organizationId: orgId,
      postTags: [],
      revisions: [{ version: 4, content: 'Rollback content' }],
    };

    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(post) // First call for permission check
              .mockResolvedValueOnce(rolledBackPost), // Second call for final result
            update: jest.fn(),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          revision: {
            findUnique: jest.fn().mockResolvedValue(revision),
            create: jest.fn(),
          },
        } as any;
        return callback(mockTx);
      });
    });

    it('should rollback to revision successfully', async () => {
      const result = await service.rollbackToRevision(orgId, postId, userId, version);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(rolledBackPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          revision: {
            findUnique: jest.fn().mockResolvedValue(revision),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw NotFoundException when revision not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(post),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(membership),
          },
          revision: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        'Revision not found',
      );
    });

    it('should throw ForbiddenException when user cannot rollback', async () => {
      const viewerMembership = { role: 'Viewer' };
      const otherAuthorPost = { id: postId, authorId: 'other-user', version: 3 };

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          post: {
            findFirst: jest.fn().mockResolvedValue(otherAuthorPost),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue(viewerMembership),
          },
          revision: {
            findUnique: jest.fn().mockResolvedValue(revision),
          },
        } as any;
        return callback(mockTx);
      });

      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.rollbackToRevision(orgId, postId, userId, version)).rejects.toThrow(
        'Only author, Editor, or OrgAdmin can rollback this post',
      );
    });
  });
});
