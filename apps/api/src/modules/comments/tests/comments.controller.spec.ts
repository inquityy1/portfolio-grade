import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../comments.controller';
import { CommentsService } from '../comments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockCommentsService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      organizationId: 'org-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(IdempotencyInterceptor)
      .useValue({ intercept: () => true })
      .compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
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

      mockCommentsService.list.mockResolvedValue(expectedComments);

      const result = await controller.list(orgId, postId);

      expect(service.list).toHaveBeenCalledWith(orgId, postId);
      expect(result).toEqual(expectedComments);
    });

    it('should throw NotFoundException when post is not found', async () => {
      const orgId = 'org-123';
      const postId = 'non-existent-post';

      mockCommentsService.list.mockRejectedValue(new NotFoundException('Post not found'));

      await expect(controller.list(orgId, postId)).rejects.toThrow(NotFoundException);
      expect(service.list).toHaveBeenCalledWith(orgId, postId);
    });
  });

  describe('create', () => {
    it('should create a new comment', async () => {
      const orgId = 'org-123';
      const postId = 'post-123';
      const content = 'This is a great post!';
      const expectedComment = {
        id: 'comment-123',
        authorId: 'user-123',
        content,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      mockCommentsService.create.mockResolvedValue(expectedComment);

      const result = await controller.create(orgId, postId, mockRequest, { content });

      expect(service.create).toHaveBeenCalledWith(orgId, postId, 'user-123', content);
      expect(result).toEqual(expectedComment);
    });

    it('should throw NotFoundException when post is not found', async () => {
      const orgId = 'org-123';
      const postId = 'non-existent-post';
      const content = 'This is a great post!';

      mockCommentsService.create.mockRejectedValue(new NotFoundException('Post not found'));

      await expect(controller.create(orgId, postId, mockRequest, { content })).rejects.toThrow(
        NotFoundException,
      );
      expect(service.create).toHaveBeenCalledWith(orgId, postId, 'user-123', content);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const content = 'Updated comment content';
      const expectedComment = {
        id: commentId,
        authorId: 'user-123',
        content,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      mockCommentsService.update.mockResolvedValue(expectedComment);

      const result = await controller.update(orgId, commentId, mockRequest, { content });

      expect(service.update).toHaveBeenCalledWith(orgId, commentId, 'user-123', content);
      expect(result).toEqual(expectedComment);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';
      const content = 'Updated comment content';

      mockCommentsService.update.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.update(orgId, commentId, mockRequest, { content })).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith(orgId, commentId, 'user-123', content);
    });

    it('should throw ForbiddenException when user is not authorized to update', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const content = 'Updated comment content';

      mockCommentsService.update.mockRejectedValue(
        new ForbiddenException('Not allowed to edit this comment'),
      );

      await expect(controller.update(orgId, commentId, mockRequest, { content })).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.update).toHaveBeenCalledWith(orgId, commentId, 'user-123', content);
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const expectedResult = { ok: true };

      mockCommentsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(orgId, commentId, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(orgId, commentId, 'user-123');
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';

      mockCommentsService.remove.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.remove(orgId, commentId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(orgId, commentId, 'user-123');
    });

    it('should throw ForbiddenException when user is not authorized to delete', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';

      mockCommentsService.remove.mockRejectedValue(
        new ForbiddenException('Not allowed to delete this comment'),
      );

      await expect(controller.remove(orgId, commentId, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.remove).toHaveBeenCalledWith(orgId, commentId, 'user-123');
    });
  });

  describe('restore', () => {
    it('should restore a deleted comment', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';
      const expectedResult = { ok: true, postId: 'post-123' };

      mockCommentsService.restore.mockResolvedValue(expectedResult);

      const result = await controller.restore(orgId, commentId, mockRequest);

      expect(service.restore).toHaveBeenCalledWith(orgId, commentId, 'user-123');
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const orgId = 'org-123';
      const commentId = 'non-existent-comment';

      mockCommentsService.restore.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.restore(orgId, commentId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.restore).toHaveBeenCalledWith(orgId, commentId, 'user-123');
    });

    it('should throw ForbiddenException when user is not authorized to restore', async () => {
      const orgId = 'org-123';
      const commentId = 'comment-123';

      mockCommentsService.restore.mockRejectedValue(
        new ForbiddenException('Only Editor or OrgAdmin can restore comments'),
      );

      await expect(controller.restore(orgId, commentId, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.restore).toHaveBeenCalledWith(orgId, commentId, 'user-123');
    });
  });
});
