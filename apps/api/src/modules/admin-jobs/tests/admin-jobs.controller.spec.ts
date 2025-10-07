import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsController } from '../admin-jobs.controller';
import { TagStatsProcessor } from '../../../infra/jobs/processors/tag-stats.processor';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { PrismaService } from '../../../infra/services/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('AdminJobsController', () => {
  let controller: AdminJobsController;
  let tagStatsProcessor: jest.Mocked<TagStatsProcessor>;
  let postPreviewProcessor: jest.Mocked<PostPreviewProcessor>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTagStatsProcessor = {
    enqueue: jest.fn(),
  };

  const mockPostPreviewProcessor = {
    enqueue: jest.fn(),
  };

  const mockPrismaService = {
    tagAggregate: {
      findMany: jest.fn(),
    },
    post: {
      findFirst: jest.fn(),
    },
    fileAsset: {
      create: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const mockRateLimitService = {
    checkLimit: jest.fn(),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminJobsController],
      providers: [
        {
          provide: TagStatsProcessor,
          useValue: mockTagStatsProcessor,
        },
        {
          provide: PostPreviewProcessor,
          useValue: mockPostPreviewProcessor,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    controller = module.get<AdminJobsController>(AdminJobsController);
    tagStatsProcessor = module.get(TagStatsProcessor);
    postPreviewProcessor = module.get(PostPreviewProcessor);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTagStats', () => {
    it('should return tag statistics for organization', async () => {
      const orgId = 'test-org-id';
      const mockTagStats = [
        {
          id: 'stat-1',
          tagId: 'tag-1',
          organizationId: orgId,
          count: 10,
          calculatedAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'stat-2',
          tagId: 'tag-2',
          organizationId: orgId,
          count: 5,
          calculatedAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      mockPrismaService.tagAggregate.findMany.mockResolvedValue(mockTagStats);

      const result = await controller.getTagStats(orgId);

      expect(result).toEqual(mockTagStats);
      expect(mockPrismaService.tagAggregate.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { count: 'asc' },
      });
    });

    it('should return empty array when no tag statistics exist', async () => {
      const orgId = 'test-org-id';
      mockPrismaService.tagAggregate.findMany.mockResolvedValue([]);

      const result = await controller.getTagStats(orgId);

      expect(result).toEqual([]);
      expect(mockPrismaService.tagAggregate.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { count: 'asc' },
      });
    });
  });

  describe('runTagStats', () => {
    it('should enqueue tag stats job and return success response', async () => {
      const orgId = 'test-org-id';
      mockTagStatsProcessor.enqueue.mockResolvedValue(undefined);

      const result = await controller.runTagStats(orgId);

      expect(result).toEqual({ ok: true, queued: true });
      expect(mockTagStatsProcessor.enqueue).toHaveBeenCalledWith(orgId);
    });

    it('should handle enqueue errors gracefully', async () => {
      const orgId = 'test-org-id';
      mockTagStatsProcessor.enqueue.mockRejectedValue(new Error('Queue error'));

      await expect(controller.runTagStats(orgId)).rejects.toThrow('Queue error');
      expect(mockTagStatsProcessor.enqueue).toHaveBeenCalledWith(orgId);
    });
  });

  describe('runPreview', () => {
    it('should enqueue preview job when Redis is available', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockJob = { id: 'job-1', data: { orgId, postId } };

      mockPostPreviewProcessor.enqueue.mockResolvedValue(mockJob);

      const result = await controller.runPreview(orgId, postId);

      expect(result).toEqual({ ok: true, queued: true });
      expect(mockPostPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
      expect(mockPrismaService.post.findFirst).not.toHaveBeenCalled();
    });

    it('should generate preview synchronously when Redis is unavailable', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockPost = {
        id: postId,
        organizationId: orgId,
        title: 'Test Post',
        content: 'Test content',
      };

      mockPostPreviewProcessor.enqueue.mockResolvedValue(null);
      mockPrismaService.post.findFirst.mockResolvedValue(mockPost);
      mockPrismaService.fileAsset.create.mockResolvedValue({
        id: 'asset-1',
        url: `https://picsum.photos/seed/${postId}/1200/630`,
        mimeType: 'image/jpeg',
        postId,
      });

      const result = await controller.runPreview(orgId, postId);

      expect(result).toEqual({
        ok: true,
        generated: true,
        message: 'Preview generated synchronously',
      });
      expect(mockPostPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).toHaveBeenCalledWith({
        data: {
          url: `https://picsum.photos/seed/${postId}/1200/630`,
          mimeType: 'image/jpeg',
          postId,
        },
      });
    });

    it('should throw error when post not found during synchronous generation', async () => {
      const orgId = 'test-org-id';
      const postId = 'non-existent-post';

      mockPostPreviewProcessor.enqueue.mockResolvedValue(null);
      mockPrismaService.post.findFirst.mockResolvedValue(null);

      await expect(controller.runPreview(orgId, postId)).rejects.toThrow('Post not found');
      expect(mockPostPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during synchronous generation', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockPost = {
        id: postId,
        organizationId: orgId,
        title: 'Test Post',
        content: 'Test content',
      };

      mockPostPreviewProcessor.enqueue.mockResolvedValue(null);
      mockPrismaService.post.findFirst.mockResolvedValue(mockPost);
      mockPrismaService.fileAsset.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.runPreview(orgId, postId)).rejects.toThrow('Database error');
      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).toHaveBeenCalledWith({
        data: {
          url: `https://picsum.photos/seed/${postId}/1200/630`,
          mimeType: 'image/jpeg',
          postId,
        },
      });
    });
  });
});
