import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, UseGuards, Req } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PostsController {
    constructor(private readonly posts: PostsService) { }

    // Everyone in org can read
    @Roles('Viewer' as Role)
    @Get()
    list(@OrgId() orgId: string) {
        return this.posts.list(orgId);
    }

    @Roles('Viewer' as Role)
    @Get(':id')
    getOne(@OrgId() orgId: string, @Param('id') id: string) {
        return this.posts.getOne(orgId, id);
    }

    // Create / update / delete -> Editor or OrgAdmin
    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @HttpPost()
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreatePostDto) {
        const authorId = req.user.userId;
        return this.posts.create(orgId, authorId, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdatePostDto) {
        const authorId = req.user.userId;
        return this.posts.update(orgId, id, authorId, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any,) {
        const userId = req.user.userId;
        return this.posts.remove(orgId, id, userId);
    }
}