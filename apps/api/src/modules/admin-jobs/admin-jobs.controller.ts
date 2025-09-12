import { Controller, Post, UseGuards, UseInterceptors, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { TagStatsProcessor } from '../../infra/jobs/processors/tag-stats.processor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { PrismaService } from '../../infra/services/prisma.service';
import { PostPreviewProcessor } from '../../infra/jobs/processors/post-preview.processor';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AdminJobsController {
    constructor(
        private readonly tagStats: TagStatsProcessor,
        private readonly prisma: PrismaService,
        private readonly preview: PostPreviewProcessor,
    ) { }

    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get('tag-stats')
    async getTagStats(@OrgId() orgId: string) {
        return this.prisma.tagAggregate.findMany({
            where: { organizationId: orgId },
            orderBy: { count: 'desc' },
        });
    }

    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post('tag-stats/run')
    async runTagStats(@OrgId() orgId: string) {
        await this.tagStats.enqueue(orgId);
        return { ok: true, queued: true };
    }

    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post('post-preview/:postId')
    async runPreview(@OrgId() orgId: string, @Param('postId') postId: string) {
        await this.preview.enqueue(orgId, postId);
        return { ok: true, queued: true };
    }
}