import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [InfraModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, CacheInterceptor, IdempotencyInterceptor, RateLimitGuard],
  exports: [SubmissionsService],
})
export class SubmissionsModule { }