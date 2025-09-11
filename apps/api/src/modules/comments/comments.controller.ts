import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CommentsController {
    constructor(private readonly comments: CommentsService) { }

    // List comments
    @Roles('Viewer' as Role)
    @Get('posts/:postId/comments')
    @UseInterceptors(CacheInterceptor)
    list(@OrgId() orgId: string, @Param('postId') postId: string) {
        return this.comments.list(orgId, postId);
    }

    // Create comment
    @Roles('Viewer' as Role)
    @Post('posts/:postId/comments')
    @UseInterceptors(IdempotencyInterceptor)
    create(@OrgId() orgId: string, @Param('postId') postId: string, @Req() req: any, @Body() dto: CreateCommentDto) {
        return this.comments.create(orgId, postId, req.user.userId, dto.content);
    }

    // Update comment
    @Roles('Viewer' as Role)
    @Patch('comments/:id')
    @UseInterceptors(IdempotencyInterceptor)
    update(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any, @Body() dto: UpdateCommentDto) {
        return this.comments.update(orgId, id, req.user.userId, dto.content);
    }

    // Delete comment
    @Roles('Viewer' as Role)
    @Delete('comments/:id')
    @UseInterceptors(IdempotencyInterceptor)
    remove(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any) {
        return this.comments.remove(orgId, id, req.user.userId);
    }

    // Restore comment
    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Post('comments/:id/restore')
    @UseInterceptors(IdempotencyInterceptor)
    restore(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any) {
        return this.comments.restore(orgId, id, req.user.userId);
    }
}