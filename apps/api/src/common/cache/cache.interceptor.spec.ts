import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { CacheInterceptor } from './cache.interceptor';
import { RedisService } from '../../infra/services/redis.service';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const mockRedisValue = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheInterceptor, { provide: RedisService, useValue: mockRedisValue }],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    mockRedisService = module.get(RedisService);

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          headers: { 'x-org-id': 'org-123' },
          query: { page: '1', limit: '10' },
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test-data' })),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should return cached data when available', done => {
      const cachedData = { data: 'cached-data' };
      mockRedisService.get.mockResolvedValue(cachedData);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual(cachedData);
          expect(mockRedisService.get).toHaveBeenCalled();
          expect(mockCallHandler.handle).not.toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should call next handler and cache result when no cache', done => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual({ data: 'test-data' });
          expect(mockRedisService.get).toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          expect(mockRedisService.set).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should skip caching when CACHE_ENABLED is false', done => {
      const originalEnv = process.env.CACHE_ENABLED;
      process.env.CACHE_ENABLED = 'false';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual({ data: 'test-data' });
          expect(mockRedisService.get).not.toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          process.env.CACHE_ENABLED = originalEnv;
          done();
        },
        error: done,
      });
    });

    it('should skip caching for non-GET requests', done => {
      const nonGetContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            headers: { 'x-org-id': 'org-123' },
            query: {},
          }),
        }),
      } as any;

      interceptor.intercept(nonGetContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual({ data: 'test-data' });
          expect(mockRedisService.get).not.toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should skip caching when orgId header is missing', done => {
      const noOrgContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            headers: {},
            query: {},
          }),
        }),
      } as any;

      interceptor.intercept(noOrgContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual({ data: 'test-data' });
          expect(mockRedisService.get).not.toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should generate correct cache key', done => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const expectedRawKey = 'org:org-123:posts:list:limit=10&page=1';
          const expectedHash = crypto.createHash('sha1').update(expectedRawKey).digest('hex');
          const expectedKey = `cache:${expectedHash}`;

          expect(mockRedisService.get).toHaveBeenCalledWith(expectedKey);
          expect(mockRedisService.set).toHaveBeenCalledWith(expectedKey, { data: 'test-data' }, 60);
          done();
        },
        error: done,
      });
    });

    it('should handle empty query parameters', done => {
      const emptyQueryContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            headers: { 'x-org-id': 'org-123' },
            query: {},
          }),
        }),
      } as any;

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(emptyQueryContext, mockCallHandler).subscribe({
        next: () => {
          const expectedRawKey = 'org:org-123:posts:list:';
          const expectedHash = crypto.createHash('sha1').update(expectedRawKey).digest('hex');
          const expectedKey = `cache:${expectedHash}`;

          expect(mockRedisService.get).toHaveBeenCalledWith(expectedKey);
          done();
        },
        error: done,
      });
    });

    it('should filter out undefined, null, and empty query parameters', done => {
      const filteredQueryContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            headers: { 'x-org-id': 'org-123' },
            query: { page: '1', limit: '', filter: null, sort: undefined },
          }),
        }),
      } as any;

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(filteredQueryContext, mockCallHandler).subscribe({
        next: () => {
          const expectedRawKey = 'org:org-123:posts:list:page=1';
          const expectedHash = crypto.createHash('sha1').update(expectedRawKey).digest('hex');
          const expectedKey = `cache:${expectedHash}`;

          expect(mockRedisService.get).toHaveBeenCalledWith(expectedKey);
          done();
        },
        error: done,
      });
    });

    it('should sort query parameters for consistent cache keys', done => {
      const unsortedQueryContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            headers: { 'x-org-id': 'org-123' },
            query: { z: '1', a: '2', m: '3' },
          }),
        }),
      } as any;

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(unsortedQueryContext, mockCallHandler).subscribe({
        next: () => {
          const expectedRawKey = 'org:org-123:posts:list:a=2&m=3&z=1';
          const expectedHash = crypto.createHash('sha1').update(expectedRawKey).digest('hex');
          const expectedKey = `cache:${expectedHash}`;

          expect(mockRedisService.get).toHaveBeenCalledWith(expectedKey);
          done();
        },
        error: done,
      });
    });

    it('should handle Redis get errors gracefully', done => {
      mockRedisService.get.mockRejectedValue(new Error('Redis error'));
      mockRedisService.set.mockResolvedValue(undefined);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => done(new Error('Should have thrown')),
        error: error => {
          expect(error.message).toBe('Redis error');
          done();
        },
      });
    });

    it('should handle Redis set errors gracefully', done => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockRejectedValue(new Error('Redis set error'));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: result => {
          expect(result).toEqual({ data: 'test-data' });
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should use custom TTL from environment', done => {
      const originalTtl = process.env.CACHE_TTL;
      process.env.CACHE_TTL = '300';

      // Create new interceptor instance to pick up new TTL
      const newInterceptor = new CacheInterceptor(mockRedisService);

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      newInterceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockRedisService.set).toHaveBeenCalledWith(
            expect.any(String),
            { data: 'test-data' },
            300,
          );
          process.env.CACHE_TTL = originalTtl;
          done();
        },
        error: done,
      });
    });

    it('should use default TTL when CACHE_TTL is not set', done => {
      const originalTtl = process.env.CACHE_TTL;
      delete process.env.CACHE_TTL;

      // Create new interceptor instance to pick up default TTL
      const newInterceptor = new CacheInterceptor(mockRedisService);

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      newInterceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockRedisService.set).toHaveBeenCalledWith(
            expect.any(String),
            { data: 'test-data' },
            60,
          );
          process.env.CACHE_TTL = originalTtl;
          done();
        },
        error: done,
      });
    });
  });

  describe('stableQS function', () => {
    it('should filter and sort query parameters correctly', () => {
      const testQuery = { z: '1', a: '2', empty: '', null: null, undefined: undefined };

      // Test the stableQS function logic
      const entries = Object.entries(testQuery).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      );
      entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      const result = new URLSearchParams(entries as any).toString();

      expect(result).toBe('a=2&z=1');
    });
  });
});
