import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { InfraModule } from '../../infra/infra.module';
import { FormsPublicController } from './forms.public.controller';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [InfraModule],
  controllers: [FormsController, FormsPublicController],
  providers: [FormsService, CacheInterceptor, IdempotencyInterceptor, RateLimitGuard],
  exports: [FormsService],
})
export class FormsModule {}
