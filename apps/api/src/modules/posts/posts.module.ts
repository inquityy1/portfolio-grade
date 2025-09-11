import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [InfraModule],
  providers: [PostsService, CacheInterceptor, IdempotencyInterceptor, RateLimitGuard],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule { }
