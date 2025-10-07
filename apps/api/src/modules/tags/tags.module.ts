import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [InfraModule],
  providers: [TagsService, CacheInterceptor, IdempotencyInterceptor, RateLimitGuard],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
