import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';

@Controller()
export class SubmissionsController {
    constructor(private readonly submissions: SubmissionsService) { }

    // PUBLIC submit form
    @UseGuards(TenantGuard)
    @Post('public/forms/:id/submit')
    submitPublic(@OrgId() orgId: string, @Param('id') formId: string, @Body() dto: CreateSubmissionDto) {
        return this.submissions.createSubmission(orgId, formId, dto.data);
    }

    // ADMIN list submissions for a form
    @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Get('forms/:id/submissions')
    listAdmin(@OrgId() orgId: string, @Param('id') formId: string) {
        return this.submissions.listSubmissions(orgId, formId);
    }

    @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
    @Roles('Viewer' as Role, 'Editor' as Role, 'OrgAdmin' as Role)
    @Get('submissions/:submissionId')
    getAdmin(@OrgId() orgId: string, @Param('submissionId') submissionId: string) {
        return this.submissions.getSubmission(orgId, submissionId);
    }
}