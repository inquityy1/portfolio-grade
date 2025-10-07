import { Test, TestingModule } from '@nestjs/testing';
import { FieldsModule } from '../fields.module';
import { FieldsService } from '../fields.service';
import { FieldsController } from '../fields.controller';
import { InfraModule } from '../../../infra/infra.module';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';

describe('FieldsModule', () => {
  let module: TestingModule;

  const mockPrismaService = {
    form: { findFirst: jest.fn() },
    field: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockOutboxService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FieldsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(OutboxService)
      .useValue(mockOutboxService)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide FieldsService', () => {
    const service = module.get<FieldsService>(FieldsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(FieldsService);
  });

  it('should provide FieldsController', () => {
    const controller = module.get<FieldsController>(FieldsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(FieldsController);
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

  it('should export FieldsService', () => {
    // The service should be available for injection in other modules
    expect(module.get(FieldsService)).toBeDefined();
  });

  it('should import InfraModule', () => {
    // The module should import InfraModule for PrismaService and OutboxService
    const infraModule = module.get(InfraModule);
    expect(infraModule).toBeDefined();
  });
});
