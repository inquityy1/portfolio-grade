import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../../infra/prisma.service';

@Module({
  providers: [PostsService, PrismaService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule { }
