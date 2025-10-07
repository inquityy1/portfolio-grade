import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../../services/queue.service';
import { QUEUE_TAG_STATS, TagStatsJob } from '../types';
import { PrismaService } from '../../services/prisma.service';
import { Job } from 'bullmq';

@Injectable()
export class TagStatsProcessor implements OnModuleInit {
  private readonly logger = new Logger(TagStatsProcessor.name);

  constructor(private readonly queues: QueueService, private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const registered = this.queues.registerWorker(
      QUEUE_TAG_STATS,
      async (job: Job<TagStatsJob>) => {
        const { orgId } = job.data as TagStatsJob;
        await this.compute(orgId);
      },
      2,
    );
    if (!registered) {
      this.logger.warn('Redis unavailable; TagStats worker not registered.');
      return;
    }

    // Nightly schedule at 02:10 (cron) — only when Redis exists
    await this.queues.addRepeatable<TagStatsJob>(
      QUEUE_TAG_STATS,
      'compute-nightly',
      // If you want a specific org nightly, you can loop known orgs. For demo use wildcard org later.
      { orgId: '__ALL__' as any },
      '10 2 * * *',
    );
  }

  /** Enqueue per org manually */
  async enqueue(orgId: string) {
    await this.queues.add<TagStatsJob>(QUEUE_TAG_STATS, 'compute', { orgId });
  }

  /** If orgId === '__ALL__', compute for all orgs */
  private async compute(orgId: string) {
    if (orgId === '__ALL__') {
      const orgs = await this.prisma.organization.findMany({ select: { id: true } });
      for (const o of orgs) {
        await this.computeForOrg(o.id);
      }
    } else {
      await this.computeForOrg(orgId);
    }
  }

  private async computeForOrg(orgId: string) {
    const tagCounts = await this.prisma.postTag.groupBy({
      by: ['tagId'],
      where: { post: { organizationId: orgId } },
      _count: { tagId: true },
    });

    // upsert materialized aggregates
    await this.prisma.$transaction(async tx => {
      for (const row of tagCounts) {
        await tx.tagAggregate.upsert({
          where: { organizationId_tagId: { organizationId: orgId, tagId: row.tagId } },
          update: { count: row._count.tagId, calculatedAt: new Date() },
          create: { organizationId: orgId, tagId: row.tagId, count: row._count.tagId },
        });
      }
    });

    this.logger.log(`[tag-stats] org=${orgId} upserted ${tagCounts.length} rows`);
  }
}
