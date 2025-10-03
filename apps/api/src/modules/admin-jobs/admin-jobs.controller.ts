import { Controller, Post, UseGuards, UseInterceptors, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { TagStatsProcessor } from '../../infra/jobs/processors/tag-stats.processor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { PrismaService } from '../../infra/services/prisma.service';
import { PostPreviewProcessor } from '../../infra/jobs/processors/post-preview.processor';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Admin Jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AdminJobsController {
    constructor(
        private readonly tagStats: TagStatsProcessor,
        private readonly prisma: PrismaService,
        private readonly preview: PostPreviewProcessor,
    ) { }


    @ApiOperation({
        summary: 'Get tag statistics for organization',
        description: 'Retrieves all tag usage statistics for the current organization, ordered by usage count descending. Returns tag ID, organization ID, count, and calculation timestamp.'
    })
    @ApiResponse({
        status: 200,
        description: 'Tag statistics retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                    tagId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                    organizationId: { type: 'string', example: 'org-a' },
                    count: { type: 'number', example: 5 },
                    calculatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get('tag-stats')
    async getTagStats(@OrgId() orgId: string) {
        return this.prisma.tagAggregate.findMany({
            where: { organizationId: orgId },
            orderBy: { count: 'asc' },
        });
    }

    @ApiOperation({
        summary: 'Run tag statistics calculation job',
        description: 'Queues a background job to recalculate tag usage statistics for the current organization. This is useful when tag counts may be out of sync.'
    })
    @ApiResponse({
        status: 200,
        description: 'Tag statistics job queued successfully',
        schema: {
            type: 'object',
            properties: {
                ok: { type: 'boolean', example: true },
                queued: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post('tag-stats/run')
    async runTagStats(@OrgId() orgId: string) {
        await this.tagStats.enqueue(orgId);
        return { ok: true, queued: true };
    }

    @ApiOperation({
        summary: 'Generate post preview image',
        description: 'Generates a preview image for a specific post. If Redis is available, the job is queued for background processing. If not, the preview is generated synchronously.'
    })
    @ApiParam({
        name: 'postId',
        description: 'The unique identifier of the post to generate a preview for',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Post preview generated successfully',
        schema: {
            type: 'object',
            properties: {
                ok: { type: 'boolean', example: true },
                queued: { type: 'boolean', example: true },
                generated: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Preview generated synchronously' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
    @ApiResponse({ status: 404, description: 'Post not found - The specified post ID does not exist' })
    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post('post-preview/:postId')
    async runPreview(@OrgId() orgId: string, @Param('postId') postId: string) {
        // Try to enqueue the job
        const job = await this.preview.enqueue(orgId, postId);

        // If job is null, Redis is unavailable, so run synchronously
        if (job === null) {
            // Run the preview generation directly
            const post = await this.prisma.post.findFirst({
                where: { id: postId, organizationId: orgId }
            });
            if (!post) {
                throw new Error('Post not found');
            }

            const url = `https://picsum.photos/seed/${postId}/1200/630`;

            // Create the file asset directly
            await this.prisma.fileAsset.create({
                data: { url, mimeType: 'image/jpeg', postId },
            });

            return { ok: true, generated: true, message: 'Preview generated synchronously' };
        }

        return { ok: true, queued: true };
    }
}