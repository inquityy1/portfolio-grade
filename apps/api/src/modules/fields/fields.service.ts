import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class FieldsService {
    constructor(private readonly prisma: PrismaService) { }

    async add(orgId: string, userId: string, formId: string, dto: { label: string; type: string; config?: any; order?: number }) {
        // ensure form belongs to org
        const form = await this.prisma.form.findFirst({ where: { id: formId, organizationId: orgId }, select: { id: true } });
        if (!form) throw new NotFoundException('Form not found');

        return this.prisma.$transaction(async (tx) => {
            const field = await tx.field.create({
                data: {
                    formId,
                    label: dto.label.trim(),
                    type: dto.type.trim(),
                    config: dto.config ?? undefined,
                    order: dto.order ?? 0,
                },
                select: { id: true, formId: true, label: true, type: true, order: true, config: true },
            });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_CREATED',
                    resource: 'Field',
                    resourceId: field.id,
                },
            });

            return field;
        });
    }

    async update(orgId: string, userId: string, fieldId: string, dto: { label?: string; type?: string; config?: any; order?: number }) {
        // ensure field belongs to org via its parent form
        const field = await this.prisma.field.findFirst({
            where: { id: fieldId, form: { organizationId: orgId } },
            select: { id: true },
        });
        if (!field) throw new NotFoundException('Field not found');

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.field.update({
                where: { id: fieldId },
                data: {
                    label: dto.label?.trim() ?? undefined,
                    type: dto.type?.trim() ?? undefined,
                    config: dto.config ?? undefined,
                    order: dto.order ?? undefined,
                },
                select: { id: true, formId: true, label: true, type: true, order: true, config: true },
            });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_UPDATED',
                    resource: 'Field',
                    resourceId: fieldId,
                },
            });

            return updated;
        });
    }

    async remove(orgId: string, userId: string, fieldId: string) {
        const field = await this.prisma.field.findFirst({
            where: { id: fieldId, form: { organizationId: orgId } },
            select: { id: true },
        });
        if (!field) throw new NotFoundException('Field not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.field.delete({ where: { id: fieldId } });
            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_DELETED',
                    resource: 'Field',
                    resourceId: fieldId,
                },
            });
        });

        return { ok: true };
    }
}