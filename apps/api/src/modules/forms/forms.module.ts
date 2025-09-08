import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PrismaService } from '../../infra/prisma.service';
import { FormsPublicController } from './forms.public.controller';

@Module({
  controllers: [FormsController, FormsPublicController],
  providers: [FormsService, PrismaService],
  exports: [FormsService],
})
export class FormsModule { }