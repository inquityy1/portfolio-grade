import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';
import { PrismaService } from './prisma.service';

describe('OutboxService', () => {
  let service: OutboxService;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      outbox: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    mockPrismaService = mockPrisma as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have publish method', () => {
      expect(typeof service.publish).toBe('function');
    });

    it('should have claim method', () => {
      expect(typeof service.claim).toBe('function');
    });

    it('should have load method', () => {
      expect(typeof service.load).toBe('function');
    });

    it('should have markDone method', () => {
      expect(typeof service.markDone).toBe('function');
    });

    it('should have markError method', () => {
      expect(typeof service.markError).toBe('function');
    });
  });

  describe('publish method', () => {
    it('should create outbox record with pending status', async () => {
      const topic = 'test.topic';
      const payload = { id: '123', name: 'test' };
      const expectedResult = { id: 'outbox-123', topic: 'test.topic' };

      (mockPrismaService.outbox.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.publish(topic, payload);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.outbox.create).toHaveBeenCalledWith({
        data: { topic, payload, status: 'pending' },
        select: { id: true, topic: true },
      });
    });

    it('should handle complex payloads', async () => {
      const topic = 'complex.topic';
      const payload = {
        nested: { data: [1, 2, 3] },
        metadata: { source: 'test' },
      };
      const expectedResult = { id: 'outbox-456', topic: 'complex.topic' };

      (mockPrismaService.outbox.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.publish(topic, payload);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.outbox.create).toHaveBeenCalledWith({
        data: { topic, payload, status: 'pending' },
        select: { id: true, topic: true },
      });
    });

    it('should handle null payload', async () => {
      const topic = 'null.topic';
      const payload = null;
      const expectedResult = { id: 'outbox-789', topic: 'null.topic' };

      (mockPrismaService.outbox.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.publish(topic, payload);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.outbox.create).toHaveBeenCalledWith({
        data: { topic, payload: null, status: 'pending' },
        select: { id: true, topic: true },
      });
    });
  });

  describe('claim method', () => {
    it('should claim pending records and mark as processing', async () => {
      const limit = 10;
      const pendingRecords = [{ id: 'outbox-1' }, { id: 'outbox-2' }, { id: 'outbox-3' }];

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue(pendingRecords),
            updateMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
        } as any;
        return callback(mockTx as any);
      });

      const result = await service.claim(limit);

      expect(result).toEqual(pendingRecords);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should use default limit of 20', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        } as any;
        return callback(mockTx);
      });

      await service.claim();

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no pending records', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        } as any;
        return callback(mockTx);
      });

      const result = await service.claim(5);

      expect(result).toEqual([]);
    });

    it('should order by createdAt ascending', async () => {
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        } as any;
        const result = await callback(mockTx as any);

        // Verify the findMany call
        expect(mockTx.outbox.findMany).toHaveBeenCalledWith({
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
          take: 25,
          select: { id: true },
        });

        return result;
      });

      await service.claim(25);
    });

    it('should update status to processing for claimed records', async () => {
      const pendingRecords = [{ id: 'outbox-1' }, { id: 'outbox-2' }];

      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue(pendingRecords),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        } as any;
        const result = await callback(mockTx as any);

        // Verify the updateMany call
        expect(mockTx.outbox.updateMany).toHaveBeenCalledWith({
          where: {
            id: { in: ['outbox-1', 'outbox-2'] },
            status: 'pending',
          },
          data: { status: 'processing' },
        });

        return result;
      });

      await service.claim(10);
    });
  });

  describe('load method', () => {
    it('should load outbox record by id', async () => {
      const id = 'outbox-123';
      const expectedRecord = {
        id: 'outbox-123',
        topic: 'test.topic',
        payload: { data: 'test' },
        status: 'processing',
        createdAt: new Date(),
        attempts: 0,
      };

      (mockPrismaService.outbox.findUnique as jest.Mock).mockResolvedValue(expectedRecord);

      const result = await service.load(id);

      expect(result).toEqual(expectedRecord);
      expect(mockPrismaService.outbox.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null when record not found', async () => {
      const id = 'nonexistent-id';

      (mockPrismaService.outbox.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.load(id);

      expect(result).toBeNull();
      expect(mockPrismaService.outbox.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('markDone method', () => {
    it('should mark record as done', async () => {
      const id = 'outbox-123';

      (mockPrismaService.outbox.update as jest.Mock).mockResolvedValue({
        id: 'outbox-123',
        status: 'done',
      });

      await service.markDone(id);

      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'done' },
      });
    });

    it('should handle update errors', async () => {
      const id = 'outbox-error';
      const error = new Error('Update failed');

      (mockPrismaService.outbox.update as jest.Mock).mockRejectedValue(error);

      await expect(service.markDone(id)).rejects.toThrow(error);
      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'done' },
      });
    });
  });

  describe('markError method', () => {
    it('should mark record as error with default attempt increment', async () => {
      const id = 'outbox-123';

      (mockPrismaService.outbox.update as jest.Mock).mockResolvedValue({
        id: 'outbox-123',
        status: 'error',
        attempts: 1,
      });

      await service.markError(id);

      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'error', attempts: { increment: 1 } },
      });
    });

    it('should mark record as error with custom attempt increment', async () => {
      const id = 'outbox-123';
      const attemptInc = 3;

      (mockPrismaService.outbox.update as jest.Mock).mockResolvedValue({
        id: 'outbox-123',
        status: 'error',
        attempts: 3,
      });

      await service.markError(id, attemptInc);

      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'error', attempts: { increment: attemptInc } },
      });
    });

    it('should handle update errors', async () => {
      const id = 'outbox-error';
      const error = new Error('Update failed');

      (mockPrismaService.outbox.update as jest.Mock).mockRejectedValue(error);

      await expect(service.markError(id)).rejects.toThrow(error);
      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'error', attempts: { increment: 1 } },
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete outbox workflow', async () => {
      // Publish
      const topic = 'workflow.test';
      const payload = { step: 1 };
      const publishedRecord = { id: 'outbox-workflow', topic };

      (mockPrismaService.outbox.create as jest.Mock).mockResolvedValue(publishedRecord);

      const published = await service.publish(topic, payload);
      expect(published).toEqual(publishedRecord);

      // Claim
      const claimedRecords = [{ id: 'outbox-workflow' }];
      mockPrismaService.$transaction.mockImplementation(async callback => {
        const mockTx = {
          outbox: {
            findMany: jest.fn().mockResolvedValue(claimedRecords),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        } as any;
        return callback(mockTx as any);
      });

      const claimed = await service.claim(10);
      expect(claimed).toEqual(claimedRecords);

      // Load
      const loadedRecord = {
        id: 'outbox-workflow',
        topic: 'workflow.test',
        payload: { step: 1 },
        status: 'processing',
        createdAt: new Date(),
        attempts: 0,
      };

      (mockPrismaService.outbox.findUnique as jest.Mock).mockResolvedValue(loadedRecord);

      const loaded = await service.load('outbox-workflow');
      expect(loaded).toEqual(loadedRecord);

      // Mark done
      (mockPrismaService.outbox.update as jest.Mock).mockResolvedValue({
        id: 'outbox-workflow',
        status: 'done',
      });

      await service.markDone('outbox-workflow');
      expect(mockPrismaService.outbox.update).toHaveBeenCalledWith({
        where: { id: 'outbox-workflow' },
        data: { status: 'done' },
      });
    });
  });
});
