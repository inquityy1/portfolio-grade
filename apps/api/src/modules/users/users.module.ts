import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Module({
  imports: [InfraModule],
  controllers: [UsersController],
  providers: [UsersService, CacheInterceptor, IdempotencyInterceptor],
  exports: [UsersService],
})
export class UsersModule { }
