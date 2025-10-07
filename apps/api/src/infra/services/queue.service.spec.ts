import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';

// Mock BullMQ and IORedis
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have getQueue method', () => {
      expect(typeof service.getQueue).toBe('function');
    });

    it('should have registerWorker method', () => {
      expect(typeof service.registerWorker).toBe('function');
    });

    it('should have add method', () => {
      expect(typeof service.add).toBe('function');
    });

    it('should have addRepeatable method', () => {
      expect(typeof service.addRepeatable).toBe('function');
    });
  });

  describe('constructor behavior', () => {
    it('should use mock Redis URL by default', () => {
      const originalRedisUrl = process.env.REDIS_URL;
      delete process.env.REDIS_URL;

      const newService = new QueueService();
      expect(newService).toBeDefined();

      process.env.REDIS_URL = originalRedisUrl;
    });

    it('should use custom Redis URL when provided', () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://localhost:6379';

      const newService = new QueueService();
      expect(newService).toBeDefined();

      process.env.REDIS_URL = originalRedisUrl;
    });

    it('should disable queueing when URL contains mock', () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://mock:6379';

      const newService = new QueueService();
      expect(newService).toBeDefined();

      process.env.REDIS_URL = originalRedisUrl;
    });
  });

  describe('getQueue method', () => {
    it('should return null when connection is not available', () => {
      // Mock connection as null
      (service as any).connection = null;

      const queue = service.getQueue('test-queue');

      expect(queue).toBeNull();
    });

    it('should create and return queue when connection is available', () => {
      // Mock connection as available
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      const queue = service.getQueue('test-queue');

      expect(queue).toBeDefined();
      expect((service as any).queues.has('test-queue')).toBe(true);
    });

    it('should return existing queue if already created', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      const queue1 = service.getQueue('existing-queue');
      const queue2 = service.getQueue('existing-queue');

      expect(queue1).toBe(queue2);
    });

    it('should create different queues for different names', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      const queue1 = service.getQueue('queue-1');
      const queue2 = service.getQueue('queue-2');

      expect(queue1).not.toBe(queue2);
      expect((service as any).queues.has('queue-1')).toBe(true);
      expect((service as any).queues.has('queue-2')).toBe(true);
    });
  });

  describe('registerWorker method', () => {
    it('should return false when connection is not available', () => {
      (service as any).connection = null;

      const result = service.registerWorker('test-worker', jest.fn());

      expect(result).toBe(false);
    });

    it('should return true when worker is registered successfully', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const processor = jest.fn();

      const result = service.registerWorker('test-worker', processor);

      expect(result).toBe(true);
      expect((service as any).workers.has('test-worker')).toBe(true);
    });

    it('should return true for existing worker', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const processor = jest.fn();

      service.registerWorker('existing-worker', processor);
      const result = service.registerWorker('existing-worker', processor);

      expect(result).toBe(true);
    });

    it('should register worker with default concurrency', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const processor = jest.fn();

      service.registerWorker('concurrency-worker', processor);

      expect((service as any).workers.has('concurrency-worker')).toBe(true);
    });

    it('should register worker with custom concurrency', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const processor = jest.fn();

      service.registerWorker('custom-concurrency-worker', processor, 5);

      expect((service as any).workers.has('custom-concurrency-worker')).toBe(true);
    });
  });

  describe('add method', () => {
    it('should return null when queue is not available', () => {
      (service as any).connection = null;

      const result = service.add('unavailable-queue', 'test-job', { data: 'test' });

      expect(result).resolves.toBeNull();
    });

    it('should add job to queue when available', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const result = await service.add('test-queue', 'test-job', { data: 'test' });

      expect(result).toEqual({ id: 'job-123' });
      expect(mockQueue.add).toHaveBeenCalledWith('test-job', { data: 'test' }, undefined);
    });

    it('should add job with options', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'job-456' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const options = { delay: 1000, priority: 10 };
      const result = await service.add('test-queue', 'test-job', { data: 'test' }, options);

      expect(result).toEqual({ id: 'job-456' });
      expect(mockQueue.add).toHaveBeenCalledWith('test-job', { data: 'test' }, options);
    });

    it('should handle different payload types', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'job-789' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const complexPayload = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: true },
      };

      await service.add('test-queue', 'complex-job', complexPayload);

      expect(mockQueue.add).toHaveBeenCalledWith('complex-job', complexPayload, undefined);
    });
  });

  describe('addRepeatable method', () => {
    it('should return null when queue is not available', () => {
      (service as any).connection = null;

      const result = service.addRepeatable('unavailable-queue', 'test-job', { data: 'test' }, 5000);

      expect(result).resolves.toBeNull();
    });

    it('should add repeatable job with number interval', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'repeatable-job-123' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const result = await service.addRepeatable(
        'test-queue',
        'repeatable-job',
        { data: 'test' },
        5000,
      );

      expect(result).toEqual({ id: 'repeatable-job-123' });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'repeatable-job',
        { data: 'test' },
        {
          repeat: { every: 5000 },
        },
      );
    });

    it('should add repeatable job with cron pattern', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'cron-job-456' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const cronPattern = '0 0 * * *'; // Daily at midnight
      const result = await service.addRepeatable(
        'test-queue',
        'cron-job',
        { data: 'test' },
        cronPattern,
      );

      expect(result).toEqual({ id: 'cron-job-456' });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'cron-job',
        { data: 'test' },
        {
          repeat: { pattern: cronPattern },
        },
      );
    });

    it('should add repeatable job with additional options', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'repeatable-with-options' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      const options = { delay: 1000, priority: 5 };
      const result = await service.addRepeatable(
        'test-queue',
        'repeatable-job',
        { data: 'test' },
        3000,
        options,
      );

      expect(result).toEqual({ id: 'repeatable-with-options' });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'repeatable-job',
        { data: 'test' },
        {
          delay: 1000,
          priority: 5,
          repeat: { every: 3000 },
        },
      );
    });

    it('should handle different interval types', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'interval-test' }),
      };
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue as any);

      // Test with number
      await service.addRepeatable('test-queue', 'number-interval', { data: 'test' }, 1000);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'number-interval',
        { data: 'test' },
        {
          repeat: { every: 1000 },
        },
      );

      // Test with string (cron)
      await service.addRepeatable('test-queue', 'cron-interval', { data: 'test' }, '0 */5 * * *');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'cron-interval',
        { data: 'test' },
        {
          repeat: { pattern: '0 */5 * * *' },
        },
      );
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors gracefully', () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://invalid:6379';

      // Should not throw
      expect(() => new QueueService()).not.toThrow();

      process.env.REDIS_URL = originalRedisUrl;
    });

    it('should handle IORedis constructor errors', () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'invalid-url';

      // Should not throw
      expect(() => new QueueService()).not.toThrow();

      process.env.REDIS_URL = originalRedisUrl;
    });
  });

  describe('queue and worker management', () => {
    it('should maintain separate queue and worker maps', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      const queue = service.getQueue('test-queue');
      const workerResult = service.registerWorker('test-worker', jest.fn());

      expect(queue).toBeDefined();
      expect(workerResult).toBe(true);
      expect((service as any).queues.has('test-queue')).toBe(true);
      expect((service as any).workers.has('test-worker')).toBe(true);
    });

    it('should handle multiple queues and workers', () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      // Create multiple queues
      const queue1 = service.getQueue('queue-1');
      const queue2 = service.getQueue('queue-2');

      // Register multiple workers
      const worker1Result = service.registerWorker('worker-1', jest.fn());
      const worker2Result = service.registerWorker('worker-2', jest.fn());

      expect(queue1).toBeDefined();
      expect(queue2).toBeDefined();
      expect(queue1).not.toBe(queue2);
      expect(worker1Result).toBe(true);
      expect(worker2Result).toBe(true);
      expect((service as any).queues.size).toBe(2);
      expect((service as any).workers.size).toBe(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      // Register worker
      const processor = jest.fn();
      const workerResult = service.registerWorker('workflow-worker', processor);

      // Get queue
      const queue = service.getQueue('workflow-queue');

      // Add job
      const jobResult = await service.add('workflow-queue', 'workflow-job', { step: 1 });

      expect(workerResult).toBe(true);
      expect(queue).toBeDefined();
      expect(jobResult).toBeDefined();
    });

    it('should handle repeatable workflow', async () => {
      const mockConnection = { status: 'ready' };
      (service as any).connection = mockConnection;

      // Register worker
      const processor = jest.fn();
      service.registerWorker('repeatable-worker', processor);

      // Add repeatable job
      const repeatableResult = await service.addRepeatable(
        'repeatable-queue',
        'repeatable-job',
        { scheduled: true },
        60000, // Every minute
      );

      expect(repeatableResult).toBeDefined();
    });
  });
});
