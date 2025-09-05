import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PrismaService } from '../../infra/prisma.service';

@Module({
  controllers: [FormsController],
  providers: [FormsService, PrismaService],
  exports: [FormsService],
})
export class FormsModule { }