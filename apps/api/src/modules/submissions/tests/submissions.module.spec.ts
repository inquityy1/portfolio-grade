import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsModule } from '../submissions.module';
import { SubmissionsService } from '../submissions.service';
import { SubmissionsController } from '../submissions.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

describe('SubmissionsModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [SubmissionsModule],
        })
        .overrideProvider(PrismaService)
        .useValue({
            form: { findFirst: jest.fn() },
            submission: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
        })
        .compile();
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide SubmissionsService', () => {
        const service = module.get<SubmissionsService>(SubmissionsService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(SubmissionsService);
    });

    it('should provide SubmissionsController', () => {
        const controller = module.get<SubmissionsController>(SubmissionsController);
        expect(controller).toBeDefined();
        expect(controller).toBeInstanceOf(SubmissionsController);
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

    it('should export SubmissionsService', () => {
        const service = module.get<SubmissionsService>(SubmissionsService);
        expect(service).toBeDefined();
    });
});
