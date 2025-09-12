import { Module } from '@nestjs/common';
import { AdminJobsController } from './admin-jobs.controller';
import { InfraModule } from '../../infra/infra.module';

@Module({
  imports: [InfraModule],
  controllers: [AdminJobsController],
})
export class AdminJobsModule { }