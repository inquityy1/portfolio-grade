import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from '../../infra/prisma.service';

@Module({
  providers: [CommentsService, PrismaService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule { }
