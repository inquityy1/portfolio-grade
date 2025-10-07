import { Test, TestingModule } from '@nestjs/testing';
import { TagStatsProcessor } from '../../../infra/jobs/processors/tag-stats.processor';
import { QueueService } from '../../../infra/services/queue.service';
import { PrismaService } from '../../../infra/services/prisma.service';

describe('TagStatsProcessor', () => {
  let processor: TagStatsProcessor;
  let queueService: jest.Mocked<QueueService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockQueueService = {
    registerWorker: jest.fn(),
    addRepeatable: jest.fn(),
    add: jest.fn(),
  };

  const mockPrismaService = {
    organization: {
      findMany: jest.fn(),
    },
    postTag: {
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
    tagAggregate: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagStatsProcessor,
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

    processor = module.get<TagStatsProcessor>(TagStatsProcessor);
    queueService = module.get(QueueService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should register worker and schedule repeatable job when Redis is available', async () => {
      mockQueueService.registerWorker.mockReturnValue(true);
      mockQueueService.addRepeatable.mockResolvedValue(undefined);

      await processor.onModuleInit();

      expect(mockQueueService.registerWorker).toHaveBeenCalledWith(
        'tag-stats',
        expect.any(Function),
        2,
      );
      expect(mockQueueService.addRepeatable).toHaveBeenCalledWith(
        'tag-stats',
        'compute-nightly',
        { orgId: '__ALL__' },
        '10 2 * * *',
      );
    });

    it('should handle Redis unavailability gracefully', async () => {
      mockQueueService.registerWorker.mockReturnValue(false);

      await processor.onModuleInit();

      expect(mockQueueService.registerWorker).toHaveBeenCalledWith(
        'tag-stats',
        expect.any(Function),
        2,
      );
      expect(mockQueueService.addRepeatable).not.toHaveBeenCalled();
    });
  });

  describe('enqueue', () => {
    it('should add job to queue with correct parameters', async () => {
      const orgId = 'test-org-id';
      mockQueueService.add.mockResolvedValue(undefined);

      await processor.enqueue(orgId);

      expect(mockQueueService.add).toHaveBeenCalledWith('tag-stats', 'compute', { orgId });
    });

    it('should handle queue errors', async () => {
      const orgId = 'test-org-id';
      mockQueueService.add.mockRejectedValue(new Error('Queue error'));

      await expect(processor.enqueue(orgId)).rejects.toThrow('Queue error');
      expect(mockQueueService.add).toHaveBeenCalledWith('tag-stats', 'compute', { orgId });
    });
  });

  describe('compute', () => {
    it('should compute stats for specific organization', async () => {
      const orgId = 'test-org-id';
      const mockTagCounts = [
        { tagId: 'tag-1', _count: { tagId: 5 } },
        { tagId: 'tag-2', _count: { tagId: 3 } },
      ];

      mockPrismaService.postTag.groupBy.mockResolvedValue(mockTagCounts);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        await callback({
          tagAggregate: {
            upsert: jest.fn().mockResolvedValue(undefined),
          },
        });
      });

      // Access private method for testing
      await (processor as any).compute(orgId);

      expect(mockPrismaService.postTag.groupBy).toHaveBeenCalledWith({
        by: ['tagId'],
        where: { post: { organizationId: orgId } },
        _count: { tagId: true },
      });
    });

    it('should compute stats for all organizations when orgId is __ALL__', async () => {
      const mockOrgs = [{ id: 'org-1' }, { id: 'org-2' }];
      const mockTagCounts = [{ tagId: 'tag-1', _count: { tagId: 5 } }];

      mockPrismaService.organization.findMany.mockResolvedValue(mockOrgs);
      mockPrismaService.postTag.groupBy.mockResolvedValue(mockTagCounts);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        await callback({
          tagAggregate: {
            upsert: jest.fn().mockResolvedValue(undefined),
          },
        });
      });

      // Access private method for testing
      await (processor as any).compute('__ALL__');

      expect(mockPrismaService.organization.findMany).toHaveBeenCalledWith({
        select: { id: true },
      });
      expect(mockPrismaService.postTag.groupBy).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors during computation', async () => {
      const orgId = 'test-org-id';
      mockPrismaService.postTag.groupBy.mockRejectedValue(new Error('Database error'));

      await expect((processor as any).compute(orgId)).rejects.toThrow('Database error');
    });
  });

  describe('computeForOrg', () => {
    it('should upsert tag aggregates correctly', async () => {
      const orgId = 'test-org-id';
      const mockTagCounts = [
        { tagId: 'tag-1', _count: { tagId: 5 } },
        { tagId: 'tag-2', _count: { tagId: 3 } },
      ];

      mockPrismaService.postTag.groupBy.mockResolvedValue(mockTagCounts);

      const mockUpsert = jest.fn().mockResolvedValue(undefined);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        await callback({
          tagAggregate: {
            upsert: mockUpsert,
          },
        });
      });

      // Access private method for testing
      await (processor as any).computeForOrg(orgId);

      expect(mockUpsert).toHaveBeenCalledTimes(2);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { organizationId_tagId: { organizationId: orgId, tagId: 'tag-1' } },
        update: { count: 5, calculatedAt: expect.any(Date) },
        create: { organizationId: orgId, tagId: 'tag-1', count: 5 },
      });
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { organizationId_tagId: { organizationId: orgId, tagId: 'tag-2' } },
        update: { count: 3, calculatedAt: expect.any(Date) },
        create: { organizationId: orgId, tagId: 'tag-2', count: 3 },
      });
    });

    it('should handle empty tag counts', async () => {
      const orgId = 'test-org-id';
      mockPrismaService.postTag.groupBy.mockResolvedValue([]);

      const mockUpsert = jest.fn().mockResolvedValue(undefined);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        await callback({
          tagAggregate: {
            upsert: mockUpsert,
          },
        });
      });

      // Access private method for testing
      await (processor as any).computeForOrg(orgId);

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const orgId = 'test-org-id';
      const mockTagCounts = [{ tagId: 'tag-1', _count: { tagId: 5 } }];

      mockPrismaService.postTag.groupBy.mockResolvedValue(mockTagCounts);
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction error'));

      await expect((processor as any).computeForOrg(orgId)).rejects.toThrow('Transaction error');
    });
  });
});
