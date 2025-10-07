import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../comments.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let prismaService: PrismaService;
  let outboxService: OutboxService;

  const mockPrismaService = {
    comment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    post: {
      findFirst: jest.fn(),
    },
    membership: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockOutboxService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    outboxService = module.get<OutboxService>(OutboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return comments for a post', async () => {
      const orgId = 'org-123';
      const postId = 'post-123';
      const expectedComments = [
        {
          id: 'comment-1',
          authorId: 'user-123',
          content: 'Great post!',
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'comment-2',
          authorId: 'user-456',
          content: 'I agree!',
          createdAt: new Date('2024-01-15T11:30:00Z'),
        },
      ];

      mockPrismaService.post.findFirst.mockResolvedValue({ id: postId });
      mockPrismaService.comment.findMany.mockResolvedValue(expectedComments);

      const result = await service.list(orgId, postId);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { postId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, authorId: true, content: true, createdAt: true },
      });
      expect(result).toEqual(expectedComments);
    });

    it('should throw NotFoundException when post is not found', async () => {
      const orgId = 'org-123';
      const postId = 'non-existent-post';

      mockPrismaService.post.findFirst.mockResolvedValue(null);

      await expect(service.list(orgId, postId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
        select: { id: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new comment', async () => {
      const orgId = 'org-123';
      const postId = 'post-123';
      const userId = 'user-123';
      const content = 'This is a great post!';
      const expectedComment = {
        id: 'comment-123',
        authorId: userId,
        content,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          post: { findFirst: jest.fn().mockResolvedValue({ id: postId }) },
          comment: { create: jest.fn().mockResolvedValue(expectedComment) },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.create(orgId, postId, userId, content);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedComment);
      expect(mockOutboxService.publish).toHaveBeenCalledWith('comment.created', {
        id: expectedComment.id,
        postId,
        orgId,
      });
    });

    it('should throw NotFoundException when post is not found', async () => {
      const orgId = 'org-123';
      const postId = 'non-existent-post';
      const userId = 'user-123';
      const content = 'This is a great post!';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          post: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.create(orgId, postId, userId, content)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a comment by author', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';
      const content = 'Updated comment content';
      const expectedComment = {
        id: commentId,
        authorId: userId,
        content,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: userId,
              deletedAt: null,
            }),
            update: jest.fn().mockResolvedValue(expectedComment),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Viewer' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.update(orgId, commentId, userId, content);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedComment);
      expect(mockOutboxService.publish).toHaveBeenCalledWith('comment.updated', {
        id: commentId,
        orgId,
      });
    });

    it('should update a comment by editor', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'editor-123';
      const content = 'Updated comment content';
      const expectedComment = {
        id: commentId,
        authorId: 'author-123',
        content,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: 'author-123',
              deletedAt: null,
            }),
            update: jest.fn().mockResolvedValue(expectedComment),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Editor' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.update(orgId, commentId, userId, content);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedComment);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';
      const userId = 'user-123';
      const content = 'Updated comment content';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.update(orgId, commentId, userId, content)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when trying to edit deleted comment', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';
      const content = 'Updated comment content';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: userId,
              deletedAt: new Date(),
            }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.update(orgId, commentId, userId, content)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not authorized to edit', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';
      const content = 'Updated comment content';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: 'other-user',
              deletedAt: null,
            }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Viewer' }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.update(orgId, commentId, userId, content)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a comment by author', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: userId,
              deletedAt: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Viewer' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.remove(orgId, commentId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
      expect(mockOutboxService.publish).toHaveBeenCalledWith('comment.deleted', {
        id: commentId,
        orgId,
      });
    });

    it('should delete a comment by editor', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'editor-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: 'author-123',
              deletedAt: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Editor' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.remove(orgId, commentId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should return ok when comment is already deleted', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: userId,
              deletedAt: new Date(),
            }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.remove(orgId, commentId, userId);

      expect(result).toEqual({ ok: true });
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';
      const userId = 'user-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.remove(orgId, commentId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              authorId: 'other-user',
              deletedAt: null,
            }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Viewer' }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.remove(orgId, commentId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restore', () => {
    it('should restore a deleted comment by editor', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'editor-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              postId: 'post-123',
              deletedAt: new Date(),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Editor' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.restore(orgId, commentId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true, postId: 'post-123' });
      expect(mockOutboxService.publish).toHaveBeenCalledWith('comment.restored', {
        id: commentId,
        orgId,
      });
    });

    it('should restore a deleted comment by admin', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'admin-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              postId: 'post-123',
              deletedAt: new Date(),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'OrgAdmin' }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.restore(orgId, commentId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true, postId: 'post-123' });
    });

    it('should return ok when comment is already active', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'editor-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              postId: 'post-123',
              deletedAt: null,
            }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.restore(orgId, commentId, userId);

      expect(result).toEqual({ ok: true, postId: 'post-123' });
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';
      const userId = 'editor-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.restore(orgId, commentId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not editor or admin', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const userId = 'user-123';

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          comment: {
            findFirst: jest.fn().mockResolvedValue({
              id: commentId,
              postId: 'post-123',
              deletedAt: new Date(),
            }),
          },
          membership: {
            findUnique: jest.fn().mockResolvedValue({ role: 'Viewer' }),
          },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.restore(orgId, commentId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
