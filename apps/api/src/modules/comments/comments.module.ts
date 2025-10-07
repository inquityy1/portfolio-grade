import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Module({
  imports: [InfraModule],
  providers: [CommentsService, CacheInterceptor, IdempotencyInterceptor],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
