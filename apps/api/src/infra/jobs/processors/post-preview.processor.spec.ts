import { Test, TestingModule } from '@nestjs/testing';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { QueueService } from '../../../infra/services/queue.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { Job } from 'bullmq';

describe('PostPreviewProcessor', () => {
  let processor: PostPreviewProcessor;
  let queueService: jest.Mocked<QueueService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockQueueService = {
    registerWorker: jest.fn(),
    add: jest.fn(),
  };

  const mockPrismaService = {
    post: {
      findFirst: jest.fn(),
    },
    fileAsset: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostPreviewProcessor,
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    processor = module.get<PostPreviewProcessor>(PostPreviewProcessor);
    queueService = module.get(QueueService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should register worker when Redis is available', async () => {
      mockQueueService.registerWorker.mockReturnValue(true);

      await processor.onModuleInit();

      expect(mockQueueService.registerWorker).toHaveBeenCalledWith(
        'post-preview',
        expect.any(Function),
        2,
      );
    });

    it('should handle Redis unavailability gracefully', async () => {
      mockQueueService.registerWorker.mockReturnValue(false);

      await processor.onModuleInit();

      expect(mockQueueService.registerWorker).toHaveBeenCalledWith(
        'post-preview',
        expect.any(Function),
        2,
      );
    });
  });

  describe('enqueue', () => {
    it('should add job to queue with correct parameters', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockJob = { id: 'job-1', data: { orgId, postId } };

      mockQueueService.add.mockResolvedValue(mockJob);

      const result = await processor.enqueue(orgId, postId);

      expect(result).toEqual(mockJob);
      expect(mockQueueService.add).toHaveBeenCalledWith('post-preview', 'generate', {
        orgId,
        postId,
      });
    });

    it('should handle queue errors', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      mockQueueService.add.mockRejectedValue(new Error('Queue error'));

      await expect(processor.enqueue(orgId, postId)).rejects.toThrow('Queue error');
      expect(mockQueueService.add).toHaveBeenCalledWith('post-preview', 'generate', {
        orgId,
        postId,
      });
    });
  });

  describe('generate', () => {
    it('should generate preview for existing post', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockPost = {
        id: postId,
        organizationId: orgId,
        title: 'Test Post',
        content: 'Test content',
      };

      mockPrismaService.post.findFirst.mockResolvedValue(mockPost);
      mockPrismaService.fileAsset.create.mockResolvedValue({
        id: 'asset-1',
        url: `https://picsum.photos/seed/${postId}/1200/630`,
        mimeType: 'image/jpeg',
        postId,
      });

      // Access private method for testing
      await (processor as any).generate(orgId, postId);

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

    it('should not generate preview for non-existent post', async () => {
      const orgId = 'test-org-id';
      const postId = 'non-existent-post';

      mockPrismaService.post.findFirst.mockResolvedValue(null);

      // Access private method for testing
      await (processor as any).generate(orgId, postId);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).not.toHaveBeenCalled();
    });

    it('should not generate preview for post from different organization', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';

      // Mock post from different organization - findFirst should return null
      mockPrismaService.post.findFirst.mockResolvedValue(null);

      // Access private method for testing
      await (processor as any).generate(orgId, postId);

      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during post lookup', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';

      mockPrismaService.post.findFirst.mockRejectedValue(new Error('Database error'));

      await expect((processor as any).generate(orgId, postId)).rejects.toThrow('Database error');
      expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
        where: { id: postId, organizationId: orgId },
      });
      expect(mockPrismaService.fileAsset.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during file asset creation', async () => {
      const orgId = 'test-org-id';
      const postId = 'test-post-id';
      const mockPost = {
        id: postId,
        organizationId: orgId,
        title: 'Test Post',
        content: 'Test content',
      };

      mockPrismaService.post.findFirst.mockResolvedValue(mockPost);
      mockPrismaService.fileAsset.create.mockRejectedValue(new Error('Database error'));

      await expect((processor as any).generate(orgId, postId)).rejects.toThrow('Database error');
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
