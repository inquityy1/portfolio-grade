import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from '../users.module';
import { UsersService } from '../users.service';
import { UsersController } from '../users.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

describe('UsersModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        const mockPrisma = {
            user: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            membership: {
                create: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        const mockOutbox = {
            publish: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [UsersModule],
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

    it('should provide UsersService', () => {
        const service = module.get<UsersService>(UsersService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(UsersService);
    });

    it('should provide UsersController', () => {
        const controller = module.get<UsersController>(UsersController);
        expect(controller).toBeDefined();
        expect(controller).toBeInstanceOf(UsersController);
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

    it('should export UsersService', () => {
        const service = module.get<UsersService>(UsersService);
        expect(service).toBeDefined();
    });
});
