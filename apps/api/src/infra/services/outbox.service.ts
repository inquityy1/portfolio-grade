import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async publish(topic: string, payload: unknown) {
    return this.prisma.outbox.create({
      data: { topic, payload: payload as any, status: 'pending' },
      select: { id: true, topic: true },
    });
  }

  async claim(limit = 20) {
    // mark as processing to avoid double work
    const rows = await this.prisma.$transaction(async tx => {
      const pending = await tx.outbox.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: { id: true },
      });
      if (pending.length === 0) return [];
      await tx.outbox.updateMany({
        where: { id: { in: pending.map(p => p.id) }, status: 'pending' },
        data: { status: 'processing' },
      });
      return pending;
    });
    if (rows.length) this.logger.debug(`claimed ${rows.length} outbox events`);
    return rows;
  }

  async load(id: string) {
    return this.prisma.outbox.findUnique({ where: { id } });
  }

  async markDone(id: string) {
    await this.prisma.outbox.update({ where: { id }, data: { status: 'done' } });
  }

  async markError(id: string, attemptInc = 1) {
    await this.prisma.outbox.update({
      where: { id },
      data: { status: 'error', attempts: { increment: attemptInc } },
    });
  }
}
