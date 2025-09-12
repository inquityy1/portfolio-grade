import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { TagsModule } from '../modules/tags/tags.module';
import { PostsModule } from '../modules/posts/posts.module';
import { CommentsModule } from '../modules/comments/comments.module';
import { AuditLogsModule } from '../modules/audit-logs/audit-logs.module';
import { FormsModule } from '../modules/forms/forms.module';
import { FieldsModule } from '../modules/fields/fields.module';
import { SubmissionsModule } from '../modules/submissions/submissions.module';
import { RedisService } from '../infra/redis.service';
import { AdminJobsModule } from '../modules/admin-jobs/admin-jobs.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    TagsModule,
    PostsModule,
    CommentsModule,
    AuditLogsModule,
    FormsModule,
    FieldsModule,
    SubmissionsModule,
    AdminJobsModule
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class AppModule { }
