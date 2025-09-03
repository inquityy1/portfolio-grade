import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { TagsModule } from '../modules/tags/tags.module';
import { PostsModule } from '../modules/posts/posts.module';

@Module({
  imports: [UsersModule, AuthModule, TagsModule, PostsModule],
})
export class AppModule { }
