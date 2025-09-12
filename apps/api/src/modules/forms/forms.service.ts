import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';
import { OutboxService } from '../../infra/services/outbox.service';

@Injectable()
export class FormsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService
    ) { }

    list(orgId: string) {
        return this.prisma.form.findMany({
            where: { organizationId: orgId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, schema: true, updatedAt: true },
        });
    }

    async get(orgId: string, id: string) {
        const form = await this.prisma.form.findFirst({
            where: { id, organizationId: orgId },
            // helpful for admin UI
            include: { fields: { orderBy: { order: 'asc' } } },
        });
        if (!form) throw new NotFoundException('Form not found');
        return form;
    }

    async create(orgId: string, userId: string, dto: { name: string; schema: any }) {
        if (typeof dto.schema !== 'object' || dto.schema === null) {
            throw new ForbiddenException('schema must be a JSON object');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const created = await tx.form.create({
                    data: { organizationId: orgId, name: dto.name, schema: dto.schema },
                    select: { id: true, name: true, schema: true, createdAt: true },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: orgId,
                        userId,
                        action: 'FORM_CREATED',
                        resource: 'Form',
                        resourceId: created.id,
                    },
                });

                await this.outbox.publish('form.created', { id: created.id, orgId });

                return created;
            });
        } catch (e: any) {
            // if you add @@unique([organizationId, name]) to Form later
            if (e.code === 'P2002') {
                throw new ForbiddenException('Form name already exists in this organization');
            }
            throw e;
        }
    }

    async update(orgId: string, userId: string, id: string, dto: { name?: string; schema?: any }) {
        const exists = await this.prisma.form.findFirst({
            where: { id, organizationId: orgId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Form not found');

        if (dto.schema !== undefined && (typeof dto.schema !== 'object' || dto.schema === null)) {
            throw new ForbiddenException('schema must be a JSON object');
        }

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.form.update({
                where: { id },
                data: { name: dto.name ?? undefined, schema: dto.schema ?? undefined },
                select: { id: true, name: true, schema: true, updatedAt: true },
            });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FORM_UPDATED',
                    resource: 'Form',
                    resourceId: id,
                },
            });

            await this.outbox.publish('form.updated', { id, orgId });

            return updated;
        });
    }

    async remove(orgId: string, userId: string, id: string) {
        const exists = await this.prisma.form.findFirst({
            where: { id, organizationId: orgId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Form not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.form.delete({ where: { id } });
            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FORM_DELETED',
                    resource: 'Form',
                    resourceId: id,
                },
            });

            await this.outbox.publish('form.deleted', { id, orgId });
        });

        return { ok: true };
    }
}