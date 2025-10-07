import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';

type ListFilters = {
  resource?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  take?: number;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, q: ListFilters) {
    const take = Math.min(Math.max(Number(q.take ?? 20), 1), 100);

    const where: any = { organizationId: orgId };
    if (q.resource) where.resource = q.resource;
    if (q.action) where.action = q.action;
    if (q.from || q.to) {
      where.at = {};
      if (q.from) where.at.gte = new Date(q.from);
      if (q.to) where.at.lte = new Date(q.to);
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { at: 'desc' },
      take,
      skip: q.cursor ? 1 : 0,
      cursor: q.cursor ? { id: q.cursor } : undefined,
      select: {
        id: true,
        at: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
      },
    });
  }
}
