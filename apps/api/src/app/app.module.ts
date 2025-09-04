import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { TagsModule } from '../modules/tags/tags.module';
import { PostsModule } from '../modules/posts/posts.module';
import { CommentsModule } from '../modules/comments/comments.module';
import { AuditLogsModule } from '../modules/audit-logs/audit-logs.module';

@Module({
  imports: [UsersModule, AuthModule, TagsModule, PostsModule, CommentsModule, AuditLogsModule],
})
export class AppModule { }
