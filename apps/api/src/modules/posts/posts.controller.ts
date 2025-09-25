import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, UseGuards, Req, Query, UseInterceptors } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PostsController {
    constructor(private readonly posts: PostsService) { }

    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    list(
        @OrgId() orgId: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('q') q?: string,
        @Query('tagId') tagId?: string,
    ) {
        return this.posts.list(orgId, {
            limit: limit ? Number(limit) : undefined,
            cursor: cursor ?? null,
            q: q ?? null,
            tagId: tagId ?? null,
        });
    }

    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    getOne(@OrgId() orgId: string, @Param('id') id: string) {
        return this.posts.getOne(orgId, id);
    }

    // Create / update / delete
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @HttpPost()
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreatePostDto) {
        const authorId = req.user.userId;
        return this.posts.create(orgId, authorId, dto);
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdatePostDto) {
        const authorId = req.user.userId;
        return this.posts.update(orgId, id, authorId, dto);
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any,) {
        const userId = req.user.userId;
        return this.posts.remove(orgId, id, userId);
    }

    // Revisions
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @Get(':id/revisions')
    listRevisions(@OrgId() orgId: string, @Param('id') id: string) {
        return this.posts.listRevisions(orgId, id);
    }


    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @Get(':id/revisions/:version')
    getRevision(@OrgId() orgId: string, @Param('id') id: string, @Param('version') version: string) {
        return this.posts.getRevision(orgId, id, Number(version));
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @HttpPost(':id/revisions/:version/rollback')
    rollback(
        @OrgId() orgId: string,
        @Req() req: any,
        @Param('id') id: string,
        @Param('version') version: string
    ) {
        return this.posts.rollbackToRevision(orgId, id, req.user.userId, Number(version));
    }
}