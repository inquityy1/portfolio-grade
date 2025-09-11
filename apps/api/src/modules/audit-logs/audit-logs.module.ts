import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Module({
  imports: [InfraModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, CacheInterceptor, IdempotencyInterceptor],
})
export class AuditLogsModule { }