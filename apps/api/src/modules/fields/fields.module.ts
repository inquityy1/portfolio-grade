import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Module({
  imports: [InfraModule],
  controllers: [FieldsController],
  providers: [FieldsService, CacheInterceptor, IdempotencyInterceptor],
  exports: [FieldsService],
})
export class FieldsModule {}
