import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from './redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedis = {
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    mockRedisService = module.get(RedisService) as jest.Mocked<RedisService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear the in-memory store between tests
    (service as any).memoryStore.clear();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have memoryStore initialized', () => {
      expect((service as any).memoryStore).toBeDefined();
      expect((service as any).memoryStore).toBeInstanceOf(Map);
    });
  });

  describe('hit method - edge cases', () => {
    it('should allow unlimited requests when limit is 0', async () => {
      const result = await service.hit('test-key', 0, 60);

      expect(result).toEqual({
        allowed: true,
        remaining: 0,
        limit: 0,
        resetSeconds: 0,
      });
    });

    it('should allow unlimited requests when limit is negative', async () => {
      const result = await service.hit('test-key', -5, 60);

      expect(result).toEqual({
        allowed: true,
        remaining: -5,
        limit: -5,
        resetSeconds: 0,
      });
    });
  });

  describe('hit method - Redis path', () => {
    let mockRedisClient: any;

    beforeEach(() => {
      mockRedisClient = {
        status: 'ready',
        multi: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);
    });

    it('should use Redis when client is ready', async () => {
      // Mock exec to return the format the service expects: [result, error] pairs
      mockRedisClient.exec.mockResolvedValue([
        [1, null],
        [1, null],
      ]);

      const result = await service.hit('test-key', 10, 60);

      expect(mockRedisService.getClient).toHaveBeenCalled();
      expect(mockRedisClient.multi).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalled();
      expect(mockRedisClient.exec).toHaveBeenCalled();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.resetSeconds).toBeGreaterThan(0);
    });

    it('should handle Redis multi command execution', async () => {
      mockRedisClient.exec.mockResolvedValue([
        [5, null],
        [1, null],
      ]);

      const result = await service.hit('test-key', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should deny requests when limit exceeded in Redis', async () => {
      mockRedisClient.exec.mockResolvedValue([
        [15, null],
        [1, null],
      ]);

      const result = await service.hit('test-key', 10, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(10);
    });

    it('should handle Redis exec returning different data types', async () => {
      mockRedisClient.exec.mockResolvedValue([
        ['3', null],
        [1, null],
      ]);

      const result = await service.hit('test-key', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
      expect(result.limit).toBe(10);
    });

    it('should calculate reset seconds correctly', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockRedisClient.exec.mockResolvedValue([
        [1, null],
        [1, null],
      ]);

      const result = await service.hit('test-key', 10, 60);

      expect(result.resetSeconds).toBeGreaterThan(0);
      expect(result.resetSeconds).toBeLessThanOrEqual(60);
    });

    it('should generate correct bucket key for Redis', async () => {
      mockRedisClient.exec.mockResolvedValue([
        [1, null],
        [1, null],
      ]);

      await service.hit('test-key', 10, 60);

      const expectedBucketKey = expect.stringMatching(/^rate:test-key:\d+$/);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(expectedBucketKey);
    });
  });

  describe('hit method - Redis fallback to memory', () => {
    beforeEach(() => {
      // Mock Redis client as not ready
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });
    });

    it('should fallback to memory when Redis is not ready', async () => {
      const result = await service.hit('test-key', 10, 60);

      expect(mockRedisService.getClient).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.resetSeconds).toBe(60);
    });

    it('should fallback to memory when Redis client is null', async () => {
      mockRedisService.getClient.mockReturnValue(null);

      const result = await service.hit('test-key', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.resetSeconds).toBe(60);
    });

    it('should fallback to memory when Redis client is undefined', async () => {
      mockRedisService.getClient.mockReturnValue(undefined);

      const result = await service.hit('test-key', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.resetSeconds).toBe(60);
    });
  });

  describe('hit method - in-memory store', () => {
    beforeEach(() => {
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });
    });

    it('should create new entry for first request', async () => {
      const result = await service.hit('new-key', 5, 30);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.resetSeconds).toBe(30);

      // Verify entry was created in memory store
      const memoryStore = (service as any).memoryStore;
      expect(memoryStore.has('new-key')).toBe(true);
      const entry = memoryStore.get('new-key');
      expect(entry.count).toBe(1);
      expect(entry.resetAt).toBeGreaterThan(Date.now());
    });

    it('should increment count for subsequent requests', async () => {
      await service.hit('test-key', 3, 60);
      const result = await service.hit('test-key', 3, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.limit).toBe(3);

      const memoryStore = (service as any).memoryStore;
      const entry = memoryStore.get('test-key');
      expect(entry.count).toBe(2);
    });

    it('should deny requests when limit exceeded in memory', async () => {
      await service.hit('test-key', 2, 60);
      await service.hit('test-key', 2, 60);
      const result = await service.hit('test-key', 2, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(2);
    });

    it('should reset window when expired', async () => {
      const memoryStore = (service as any).memoryStore;

      // Create an expired entry
      memoryStore.set('test-key', {
        count: 5,
        resetAt: Date.now() - 1000, // Expired 1 second ago
      });

      const result = await service.hit('test-key', 3, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(3);

      const entry = memoryStore.get('test-key');
      expect(entry.count).toBe(1); // Reset to 1
      expect(entry.resetAt).toBeGreaterThan(Date.now());
    });

    it('should handle multiple keys independently', async () => {
      await service.hit('key1', 2, 60);
      await service.hit('key2', 2, 60);
      await service.hit('key1', 2, 60);

      const memoryStore = (service as any).memoryStore;
      expect(memoryStore.get('key1').count).toBe(2);
      expect(memoryStore.get('key2').count).toBe(1);
    });

    it('should calculate reset seconds correctly for memory store', async () => {
      const result = await service.hit('test-key', 5, 30);

      expect(result.resetSeconds).toBe(30);
    });

    it('should handle edge case when reset time is very close', async () => {
      const memoryStore = (service as any).memoryStore;

      // Set entry that expires very soon
      memoryStore.set('test-key', {
        count: 1,
        resetAt: Date.now() + 100, // Expires in 100ms
      });

      const result = await service.hit('test-key', 5, 60);

      expect(result.resetSeconds).toBeGreaterThan(0);
      expect(result.resetSeconds).toBeLessThanOrEqual(1);
    });
  });

  describe('hit method - Redis error handling', () => {
    let mockRedisClient: any;

    beforeEach(() => {
      mockRedisClient = {
        status: 'ready',
        multi: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);
    });

    it('should fallback to memory when Redis exec throws error', async () => {
      mockRedisClient.exec.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.hit('test-key', 5, 60);

      // Should fallback to memory store
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.resetSeconds).toBe(60);
    });

    it('should fallback to memory when Redis exec returns null', async () => {
      mockRedisClient.exec.mockResolvedValue(null);

      const result = await service.hit('test-key', 5, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });
  });

  describe('hit method - window sharding', () => {
    let mockRedisClient: any;

    beforeEach(() => {
      mockRedisClient = {
        status: 'ready',
        multi: jest.fn().mockReturnThis(),
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);
    });

    it('should create different bucket keys for different windows', async () => {
      mockRedisClient.exec.mockResolvedValue([
        [1, null],
        [1, null],
      ]);

      // Mock Date.now to return a specific timestamp aligned to 60-second windows
      const originalDateNow = Date.now;
      // Use a timestamp that's perfectly aligned to 60-second boundaries
      // 1000000020 seconds since epoch (divisible by 60)
      const mockTimeSeconds = 1000000020; // This gives us window 16666667
      const mockTime = mockTimeSeconds * 1000; // Convert to milliseconds
      Date.now = jest.fn(() => mockTime);

      await service.hit('test-key', 10, 60);
      const firstCallKey = mockRedisClient.incr.mock.calls[0][0];

      // Advance time by 30 seconds (half window) - should be same window
      Date.now = jest.fn(() => mockTime + 30000);
      await service.hit('test-key', 10, 60);
      const secondCallKey = mockRedisClient.incr.mock.calls[1][0];

      expect(firstCallKey).toBe(secondCallKey); // Same window

      // Advance time by another 30 seconds (new window) - should be different window
      Date.now = jest.fn(() => mockTime + 60000);
      await service.hit('test-key', 10, 60);
      const thirdCallKey = mockRedisClient.incr.mock.calls[2][0];

      expect(firstCallKey).not.toBe(thirdCallKey); // Different window

      Date.now = originalDateNow;
    });
  });

  describe('hit method - integration scenarios', () => {
    it('should handle rapid successive calls', async () => {
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });

      const promises = Array.from({ length: 5 }, () => service.hit('rapid-key', 3, 60));

      const results = await Promise.all(promises);

      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);
      expect(results[3].allowed).toBe(false);
      expect(results[4].allowed).toBe(false);
    });

    it('should handle different limits and windows', async () => {
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });

      const result1 = await service.hit('key1', 10, 60);
      const result2 = await service.hit('key2', 5, 30);

      expect(result1.limit).toBe(10);
      expect(result1.resetSeconds).toBe(60);
      expect(result2.limit).toBe(5);
      expect(result2.resetSeconds).toBe(30);
    });

    it('should maintain state across multiple calls', async () => {
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });

      const results = [];
      for (let i = 0; i < 4; i++) {
        results.push(await service.hit('persistent-key', 3, 60));
      }

      expect(results[0].remaining).toBe(2);
      expect(results[1].remaining).toBe(1);
      expect(results[2].remaining).toBe(0);
      expect(results[3].remaining).toBe(0);

      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);
      expect(results[3].allowed).toBe(false);
    });
  });

  describe('memory store cleanup', () => {
    beforeEach(() => {
      mockRedisService.getClient.mockReturnValue({ status: 'disconnected' });
    });

    it('should clean up expired entries on new requests', async () => {
      const memoryStore = (service as any).memoryStore;

      // Add expired entry
      memoryStore.set('expired-key', {
        count: 5,
        resetAt: Date.now() - 1000,
      });

      await service.hit('expired-key', 3, 60);

      const entry = memoryStore.get('expired-key');
      expect(entry.count).toBe(1); // Should reset
      expect(entry.resetAt).toBeGreaterThan(Date.now());
    });
  });
});
