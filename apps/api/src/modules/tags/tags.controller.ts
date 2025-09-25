import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { TagsService } from './tags.service';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TagsController {
    constructor(private readonly tags: TagsService) { }

    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    list(@OrgId() orgId: string) {
        return this.tags.list(orgId);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@OrgId() orgId: string, @Req() req: any, @Body() body: { name: string }) {
        return this.tags.create(orgId, req.user.userId, body.name.trim());
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() body: { name?: string }) {
        return this.tags.update(orgId, req.user.userId, id, { name: body.name?.trim() });
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string) {
        return this.tags.remove(orgId, req.user.userId, id);
    }
}