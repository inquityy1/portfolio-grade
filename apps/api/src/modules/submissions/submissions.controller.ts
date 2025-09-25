import { Body, Controller, Get, Param, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller()
export class SubmissionsController {
    constructor(private readonly submissions: SubmissionsService) { }

    // PUBLIC submit form
    @UseGuards(TenantGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perIp: { limit: 10, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post('public/forms/:id/submit')
    submitPublic(@OrgId() orgId: string, @Param('id') formId: string, @Body() dto: CreateSubmissionDto) {
        return this.submissions.createSubmission(orgId, formId, dto.data);
    }

    // ADMIN list submissions for a form
    @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
    @Roles('Editor' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get('forms/:id/submissions')
    listAdmin(@OrgId() orgId: string, @Param('id') formId: string) {
        return this.submissions.listSubmissions(orgId, formId);
    }

    @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
    @Roles('Viewer' as Role, 'Editor' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get('submissions/:submissionId')
    getAdmin(@OrgId() orgId: string, @Param('submissionId') submissionId: string) {
        return this.submissions.getSubmission(orgId, submissionId);
    }
}