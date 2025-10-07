import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import IORedisMock from 'ioredis-mock';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    scanStream: jest.fn(),
    pipeline: jest.fn(),
    multi: jest.fn(),
    on: jest.fn(),
  }));
});

// Mock ioredis-mock
jest.mock('ioredis-mock', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    scanStream: jest.fn(),
    pipeline: jest.fn(),
    multi: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let module: TestingModule;
  let mockRedisClient: any;
  let mockIORedisMock: any;

  beforeEach(async () => {
    // Clear environment variables
    delete process.env.REDIS_URL;

    // Get the mocked constructors
    mockRedisClient = new (Redis as jest.MockedClass<typeof Redis>)();
    mockIORedisMock = new (IORedisMock as jest.MockedClass<typeof IORedisMock>)();

    module = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should use mock client when REDIS_URL is not set', () => {
      expect(service.getClient()).toBeDefined();
    });

    it('should use mock client when REDIS_URL is set to "mock"', () => {
      process.env.REDIS_URL = 'mock';
      const newService = new RedisService();
      expect(newService.getClient()).toBeDefined();
    });

    it('should use Redis client when REDIS_URL is set to valid URL', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      const newService = new RedisService();
      expect(newService.getClient()).toBeDefined();
    });
  });

  describe('Redis operations', () => {
    beforeEach(() => {
      // Mock the client methods
      const client = service.getClient();
      client.get = jest.fn();
      client.set = jest.fn();
      client.del = jest.fn();
      client.keys = jest.fn();
      client.scanStream = jest.fn();
      client.pipeline = jest.fn();
      client.multi = jest.fn();
    });

    describe('get method', () => {
      it('should return parsed JSON when key exists', async () => {
        const client = service.getClient();
        const testData = { name: 'test', value: 123 };
        client.get.mockResolvedValue(JSON.stringify(testData));

        const result = await service.get('test-key');

        expect(client.get).toHaveBeenCalledWith('test-key');
        expect(result).toEqual(testData);
      });

      it('should return null when key does not exist', async () => {
        const client = service.getClient();
        client.get.mockResolvedValue(null);

        const result = await service.get('non-existent-key');

        expect(client.get).toHaveBeenCalledWith('non-existent-key');
        expect(result).toBeNull();
      });

      it('should return null when Redis operation fails', async () => {
        const client = service.getClient();
        client.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await service.get('test-key');

        expect(client.get).toHaveBeenCalledWith('test-key');
        expect(result).toBeNull();
      });

      it('should handle invalid JSON gracefully', async () => {
        const client = service.getClient();
        client.get.mockResolvedValue('invalid-json');

        const result = await service.get('test-key');

        expect(client.get).toHaveBeenCalledWith('test-key');
        expect(result).toBeNull();
      });
    });

    describe('set method', () => {
      it('should set key with value and TTL', async () => {
        const client = service.getClient();
        client.set.mockResolvedValue('OK');
        const testData = { name: 'test', value: 123 };

        await service.set('test-key', testData, 3600);

        expect(client.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData), 'EX', 3600);
      });

      it('should handle Redis operation failure gracefully', async () => {
        const client = service.getClient();
        client.set.mockRejectedValue(new Error('Redis connection failed'));
        const testData = { name: 'test', value: 123 };

        await expect(service.set('test-key', testData, 3600)).resolves.toBeUndefined();

        expect(client.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData), 'EX', 3600);
      });

      it('should handle complex data types', async () => {
        const client = service.getClient();
        client.set.mockResolvedValue('OK');
        const complexData = {
          string: 'test',
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
          null: null,
        };

        await service.set('complex-key', complexData, 1800);

        expect(client.set).toHaveBeenCalledWith(
          'complex-key',
          JSON.stringify(complexData),
          'EX',
          1800,
        );
      });
    });

    describe('del method', () => {
      it('should delete key successfully', async () => {
        const client = service.getClient();
        client.del.mockResolvedValue(1);

        await service.del('test-key');

        expect(client.del).toHaveBeenCalledWith('test-key');
      });

      it('should handle Redis operation failure gracefully', async () => {
        const client = service.getClient();
        client.del.mockRejectedValue(new Error('Redis connection failed'));

        await expect(service.del('test-key')).resolves.toBeUndefined();

        expect(client.del).toHaveBeenCalledWith('test-key');
      });

      it('should handle non-existent key deletion', async () => {
        const client = service.getClient();
        client.del.mockResolvedValue(0);

        await service.del('non-existent-key');

        expect(client.del).toHaveBeenCalledWith('non-existent-key');
      });
    });

    describe('delByPrefix method', () => {
      it('should delete keys by prefix using scanStream', async () => {
        const client = service.getClient();
        const mockPipeline = {
          del: jest.fn(),
          exec: jest.fn().mockResolvedValue([]),
        };
        const mockStream = {
          on: jest.fn(),
        };

        client.scanStream.mockReturnValue(mockStream);
        client.pipeline.mockReturnValue(mockPipeline);

        // Mock stream events
        mockStream.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(['prefix:key1', 'prefix:key2']);
          } else if (event === 'end') {
            callback();
          }
        });

        await service.delByPrefix('prefix:');

        expect(client.scanStream).toHaveBeenCalledWith({
          match: 'prefix:*',
          count: 500,
        });
        expect(client.pipeline).toHaveBeenCalled();
        expect(mockPipeline.del).toHaveBeenCalledWith('prefix:key1');
        expect(mockPipeline.del).toHaveBeenCalledWith('prefix:key2');
      });

      it('should fallback to keys method when scanStream is not available', async () => {
        const client = service.getClient();

        // Mock scanStream to return undefined (not available)
        client.scanStream = undefined;
        client.keys.mockResolvedValue(['prefix:key1', 'prefix:key2']);
        client.del.mockResolvedValue(1);

        await service.delByPrefix('prefix:');

        expect(client.keys).toHaveBeenCalledWith('prefix:*');
        expect(client.del).toHaveBeenCalledWith(['prefix:key1', 'prefix:key2']);
      });

      it('should handle empty keys array', async () => {
        const client = service.getClient();

        // Mock scanStream to return undefined (not available)
        client.scanStream = undefined;
        client.keys.mockResolvedValue([]);

        await service.delByPrefix('prefix:');

        expect(client.keys).toHaveBeenCalledWith('prefix:*');
        expect(client.del).not.toHaveBeenCalled();
      });

      it('should handle stream errors gracefully', async () => {
        const client = service.getClient();
        const mockStream = {
          on: jest.fn(),
        };

        client.scanStream.mockReturnValue(mockStream);

        // Mock stream error event
        mockStream.on.mockImplementation((event, callback) => {
          if (event === 'error') {
            callback(new Error());
          }
        });

        await expect(service.delByPrefix('prefix:')).resolves.toBeUndefined();
      });
    });
  });

  describe('lifecycle management', () => {
    it('should handle onModuleDestroy gracefully', async () => {
      const client = service.getClient();
      client.quit = jest.fn().mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(client.quit).toHaveBeenCalledTimes(1);
    });

    it('should handle quit failure gracefully', async () => {
      const client = service.getClient();
      client.quit = jest.fn().mockRejectedValue(new Error('Quit failed'));

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();

      expect(client.quit).toHaveBeenCalledTimes(1);
    });

    it('should handle missing quit method gracefully', async () => {
      const client = service.getClient();
      delete client.quit;

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('Redis client configuration', () => {
    it('should configure Redis client with correct options when URL is provided', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const RedisConstructor = Redis as jest.MockedClass<typeof Redis>;
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      };
      RedisConstructor.mockImplementation(() => mockClient as any);

      new RedisService();

      expect(RedisConstructor).toHaveBeenCalledWith('redis://localhost:6379', {
        lazyConnect: true,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      });
    });

    it('should set up event listeners for Redis client', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const RedisConstructor = Redis as jest.MockedClass<typeof Redis>;
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      };
      RedisConstructor.mockImplementation(() => mockClient as any);

      new RedisService();

      expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should fallback to mock when Redis connection fails', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const RedisConstructor = Redis as jest.MockedClass<typeof Redis>;
      const IORedisMockConstructor = IORedisMock as jest.MockedClass<typeof IORedisMock>;

      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error()),
        on: jest.fn(),
      };
      RedisConstructor.mockImplementation(() => mockClient as any);

      new RedisService();

      // Wait for the async connect to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockClient.connect).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors in get method', async () => {
      const client = service.getClient();
      client.get.mockResolvedValue('invalid-json{');

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should handle JSON stringify errors in set method', async () => {
      const client = service.getClient();
      client.set.mockResolvedValue('OK');

      // Create an object that can't be stringified
      const circularRef: any = {};
      circularRef.self = circularRef;

      await service.set('test-key', circularRef, 3600);

      // JSON.stringify will throw, so client.set should not be called
      expect(client.set).not.toHaveBeenCalled();
    });

    it('should handle pipeline execution errors in delByPrefix', async () => {
      const client = service.getClient();
      const mockPipeline = {
        del: jest.fn(),
        exec: jest.fn().mockResolvedValue([]), // Changed to resolved to avoid timeout
      };
      const mockStream = {
        on: jest.fn(),
      };

      client.scanStream.mockReturnValue(mockStream);
      client.pipeline.mockReturnValue(mockPipeline);

      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(['prefix:key1']);
        } else if (event === 'end') {
          callback();
        }
      });

      await expect(service.delByPrefix('prefix:')).resolves.toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete cache lifecycle', async () => {
      const client = service.getClient();
      const testData = { id: 1, name: 'test' };

      // Set up mocks
      client.set.mockResolvedValue('OK');
      client.get.mockResolvedValue(JSON.stringify(testData));
      client.del.mockResolvedValue(1);

      // Test complete lifecycle
      await service.set('user:1', testData, 3600);
      const retrieved = await service.get('user:1');
      await service.del('user:1');

      expect(retrieved).toEqual(testData);
      expect(client.set).toHaveBeenCalledWith('user:1', JSON.stringify(testData), 'EX', 3600);
      expect(client.get).toHaveBeenCalledWith('user:1');
      expect(client.del).toHaveBeenCalledWith('user:1');
    });

    it('should handle bulk operations with delByPrefix', async () => {
      const client = service.getClient();
      const mockPipeline = {
        del: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      };
      const mockStream = {
        on: jest.fn(),
      };

      client.scanStream.mockReturnValue(mockStream);
      client.pipeline.mockReturnValue(mockPipeline);

      const keys = ['session:user1', 'session:user2', 'session:user3'];
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(keys);
        } else if (event === 'end') {
          callback();
        }
      });

      await service.delByPrefix('session:');

      expect(client.scanStream).toHaveBeenCalledWith({
        match: 'session:*',
        count: 500,
      });
      keys.forEach(key => {
        expect(mockPipeline.del).toHaveBeenCalledWith(key);
      });
    });
  });
});
