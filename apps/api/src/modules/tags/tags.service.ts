import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';
import { OutboxService } from '../../infra/services/outbox.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService, private readonly outbox: OutboxService) {}

  list(orgId: string) {
    return this.prisma.tag.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  async create(orgId: string, userId: string, name: string) {
    try {
      return await this.prisma.$transaction(async tx => {
        const created = await tx.tag.create({
          data: { organizationId: orgId, name },
          select: { id: true, name: true },
        });

        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userId,
            action: 'TAG_CREATED',
            resource: 'Tag',
            resourceId: created.id,
          },
        });

        await this.outbox.publish('tag.created', { id: created.id, orgId });

        return created;
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Tag name already exists in this org');
      throw e;
    }
  }

  async update(orgId: string, userId: string, id: string, data: { name?: string }) {
    const exists = await this.prisma.tag.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Tag not found');

    try {
      return await this.prisma.$transaction(async tx => {
        const updated = await tx.tag.update({
          where: { id },
          data,
          select: { id: true, name: true },
        });

        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userId,
            action: 'TAG_UPDATED',
            resource: 'Tag',
            resourceId: id,
          },
        });

        await this.outbox.publish('tag.updated', { id, orgId });

        return updated;
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Tag name already exists in this org');
      throw e;
    }
  }

  async remove(orgId: string, userId: string, id: string) {
    const exists = await this.prisma.tag.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Tag not found');

    await this.prisma.$transaction(async tx => {
      await tx.tag.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'TAG_DELETED',
          resource: 'Tag',
          resourceId: id,
        },
      });

      await this.outbox.publish('tag.deleted', { id, orgId });
    });

    return { ok: true };
  }
}
