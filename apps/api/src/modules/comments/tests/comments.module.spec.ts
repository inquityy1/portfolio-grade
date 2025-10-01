import { Test, TestingModule } from '@nestjs/testing';
import { CommentsModule } from '../comments.module';
import { CommentsService } from '../comments.service';
import { CommentsController } from '../comments.controller';
import { InfraModule } from '../../../infra/infra.module';
import { CacheInterceptor } from '../../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../../common/http/idempotency/idempotency.interceptor';

describe('CommentsModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CommentsModule],
        }).compile();
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide CommentsService', () => {
        const service = module.get<CommentsService>(CommentsService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(CommentsService);
    });

    it('should provide CommentsController', () => {
        const controller = module.get<CommentsController>(CommentsController);
        expect(controller).toBeDefined();
        expect(controller).toBeInstanceOf(CommentsController);
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

    it('should export CommentsService', () => {
        // The service should be available for injection in other modules
        expect(module.get(CommentsService)).toBeDefined();
    });
});
