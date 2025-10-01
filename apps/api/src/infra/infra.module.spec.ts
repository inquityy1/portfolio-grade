import { Test, TestingModule } from '@nestjs/testing';
import { InfraModule } from './infra.module';
import { RedisService } from './services/redis.service';
import { PrismaService } from './services/prisma.service';
import { OutboxService } from './services/outbox.service';
import { DispatcherService } from './services/dispatcher.service';
import { RateLimitService } from './services/rate-limit.service';
import { QueueService } from './services/queue.service';
import { TagStatsProcessor } from './jobs/processors/tag-stats.processor';
import { PostPreviewProcessor } from './jobs/processors/post-preview.processor';

describe('InfraModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        const mockRedisService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
            keys: jest.fn(),
            flushall: jest.fn(),
        };

        const mockPrismaService = {
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            $transaction: jest.fn(),
            user: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            organization: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            post: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            comment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            tag: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            form: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            field: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            submission: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            auditLog: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            membership: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            tagAggregate: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), upsert: jest.fn() },
        };

        const mockOutboxService = {
            publish: jest.fn(),
            processOutbox: jest.fn(),
        };

        const mockDispatcherService = {
            dispatch: jest.fn(),
            registerHandler: jest.fn(),
        };

        const mockRateLimitService = {
            hit: jest.fn(),
            checkLimit: jest.fn(),
        };

        const mockQueueService = {
            add: jest.fn(),
            process: jest.fn(),
            getJobs: jest.fn(),
        };

        const mockTagStatsProcessor = {
            process: jest.fn(),
        };

        const mockPostPreviewProcessor = {
            process: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [InfraModule],
        })
            .overrideProvider(RedisService)
            .useValue(mockRedisService)
            .overrideProvider(PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(OutboxService)
            .useValue(mockOutboxService)
            .overrideProvider(DispatcherService)
            .useValue(mockDispatcherService)
            .overrideProvider(RateLimitService)
            .useValue(mockRateLimitService)
            .overrideProvider(QueueService)
            .useValue(mockQueueService)
            .overrideProvider(TagStatsProcessor)
            .useValue(mockTagStatsProcessor)
            .overrideProvider(PostPreviewProcessor)
            .useValue(mockPostPreviewProcessor)
            .compile();
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide RedisService', () => {
        const service = module.get<RedisService>(RedisService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide PrismaService', () => {
        const service = module.get<PrismaService>(PrismaService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide OutboxService', () => {
        const service = module.get<OutboxService>(OutboxService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide DispatcherService', () => {
        const service = module.get<DispatcherService>(DispatcherService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide RateLimitService', () => {
        const service = module.get<RateLimitService>(RateLimitService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide QueueService', () => {
        const service = module.get<QueueService>(QueueService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
    });

    it('should provide TagStatsProcessor', () => {
        const processor = module.get<TagStatsProcessor>(TagStatsProcessor);
        expect(processor).toBeDefined();
        expect(processor).toBeInstanceOf(Object);
    });

    it('should provide PostPreviewProcessor', () => {
        const processor = module.get<PostPreviewProcessor>(PostPreviewProcessor);
        expect(processor).toBeDefined();
        expect(processor).toBeInstanceOf(Object);
    });

    describe('module exports', () => {
        it('should export RedisService', () => {
            const service = module.get<RedisService>(RedisService);
            expect(service).toBeDefined();
        });

        it('should export PrismaService', () => {
            const service = module.get<PrismaService>(PrismaService);
            expect(service).toBeDefined();
        });

        it('should export OutboxService', () => {
            const service = module.get<OutboxService>(OutboxService);
            expect(service).toBeDefined();
        });

        it('should export RateLimitService', () => {
            const service = module.get<RateLimitService>(RateLimitService);
            expect(service).toBeDefined();
        });

        it('should export QueueService', () => {
            const service = module.get<QueueService>(QueueService);
            expect(service).toBeDefined();
        });

        it('should export TagStatsProcessor', () => {
            const processor = module.get<TagStatsProcessor>(TagStatsProcessor);
            expect(processor).toBeDefined();
        });

        it('should export PostPreviewProcessor', () => {
            const processor = module.get<PostPreviewProcessor>(PostPreviewProcessor);
            expect(processor).toBeDefined();
        });
    });

    describe('module configuration', () => {
        it('should have correct module structure', () => {
            const infraModule = module.get(InfraModule);
            expect(infraModule).toBeDefined();
        });
    });
});
