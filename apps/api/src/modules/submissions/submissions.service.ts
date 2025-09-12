import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';
import { JsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class SubmissionsService {
    constructor(private readonly prisma: PrismaService) { }

    /** Public + Admin: create a submission for a form (org-scoped) */
    async createSubmission(orgId: string, formId: string, data: Record<string, unknown>) {
        // Ensure form belongs to org
        const form = await this.prisma.form.findFirst({
            where: { id: formId, organizationId: orgId },
            select: { id: true },
        });
        if (!form) throw new NotFoundException('Form not found');

        return this.prisma.submission.create({
            data: { formId, data: data as JsonValue },
            select: { id: true, formId: true, data: true, createdAt: true },
        });
    }

    /** Admin: list submissions for a form (org-scoped) */
    async listSubmissions(orgId: string, formId: string) {
        // Ensure form belongs to org
        const form = await this.prisma.form.findFirst({
            where: { id: formId, organizationId: orgId },
            select: { id: true },
        });
        if (!form) throw new NotFoundException('Form not found');

        return this.prisma.submission.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, data: true, createdAt: true },
        });
    }

    /** Admin: get a single submission by id (org-scoped via form) */
    async getSubmission(orgId: string, submissionId: string) {
        const sub = await this.prisma.submission.findFirst({
            where: { id: submissionId, form: { organizationId: orgId } },
            select: { id: true, formId: true, data: true, createdAt: true },
        });
        if (!sub) throw new NotFoundException('Submission not found');
        return sub;
    }
}