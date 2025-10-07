import { Test, TestingModule } from '@nestjs/testing';
import { PostsModule } from '../posts.module';
import { PostsService } from '../posts.service';
import { PostsController } from '../posts.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RedisService } from '../../../infra/services/redis.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

describe('PostsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PostsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        post: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          delete: jest.fn(),
        },
        tag: { count: jest.fn() },
        membership: { findUnique: jest.fn() },
        postTag: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
        tagAggregate: { upsert: jest.fn(), updateMany: jest.fn() },
        revision: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
      })
      .overrideProvider(RedisService)
      .useValue({
        delByPrefix: jest.fn(),
      })
      .overrideProvider(OutboxService)
      .useValue({
        publish: jest.fn(),
      })
      .overrideProvider(PostPreviewProcessor)
      .useValue({
        enqueue: jest.fn(),
      })
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PostsService', () => {
    const service = module.get<PostsService>(PostsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PostsService);
  });

  it('should provide PostsController', () => {
    const controller = module.get<PostsController>(PostsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(PostsController);
  });

  it('should provide CacheInterceptor', () => {
    const interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    expect(interceptor).toBeDefined();
    expect(interceptor).toBeInstanceOf(CacheInterceptor);
  });

  it('should provide IdempotencyInterceptor', () => {
    const interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
    expect(interceptor).toBeDefined();
    expect(interceptor).toBeInstanceOf(IdempotencyInterceptor);
  });

  it('should provide RateLimitGuard', () => {
    const guard = module.get<RateLimitGuard>(RateLimitGuard);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(RateLimitGuard);
  });

  it('should export PostsService', () => {
    const service = module.get<PostsService>(PostsService);
    expect(service).toBeDefined();
  });
});
