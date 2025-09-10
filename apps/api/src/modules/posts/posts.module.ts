import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../../infra/prisma.service';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';

@Module({
  imports: [InfraModule],
  providers: [PostsService, PrismaService, CacheInterceptor],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule { }
