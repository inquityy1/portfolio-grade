import { Test, TestingModule } from '@nestjs/testing';
import { TagsModule } from '../tags.module';
import { TagsService } from '../tags.service';
import { TagsController } from '../tags.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

describe('TagsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockPrisma = {
      tag: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [TagsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(OutboxService)
      .useValue(mockOutbox)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide TagsService', () => {
    const service = module.get<TagsService>(TagsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(TagsService);
  });

  it('should provide TagsController', () => {
    const controller = module.get<TagsController>(TagsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(TagsController);
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

  it('should export TagsService', () => {
    const service = module.get<TagsService>(TagsService);
    expect(service).toBeDefined();
  });
});
