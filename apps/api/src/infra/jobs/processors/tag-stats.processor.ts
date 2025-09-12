import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../../../infra/queue.service';
import { QUEUE_TAG_STATS, TagStatsJob } from '../types';
import { PrismaService } from '../../../infra/prisma.service';
import { Job } from 'bullmq';

@Injectable()
export class TagStatsProcessor implements OnModuleInit {
    private readonly logger = new Logger(TagStatsProcessor.name);

    constructor(
        private readonly queues: QueueService,
        private readonly prisma: PrismaService,
    ) { }

    onModuleInit() {
        const registered = this.queues.registerWorker(
            QUEUE_TAG_STATS,
            async (job: Job<TagStatsJob>) => {
                const data = job.data as TagStatsJob;
                await this.compute(data.orgId);
            },
            2,
        );
        if (!registered) {
            this.logger.warn('Redis unavailable; TagStats worker not registered (will no-op).');
        }
    }

    /** Enqueue a job */
    async enqueue(orgId: string) {
        await this.queues.add<TagStatsJob>(QUEUE_TAG_STATS, 'compute', { orgId });
    }

    /** Actual computation — simplistic example materialization */
    private async compute(orgId: string) {
        // Example: compute counts of posts per tag for org
        const tagCounts = await this.prisma.postTag.groupBy({
            by: ['tagId'],
            where: { post: { organizationId: orgId } },
            _count: { tagId: true },
        });

        // This demo simply logs. In a real app, upsert into a materialized table.
        this.logger.log(`[tag-stats] org=${orgId} counts=${JSON.stringify(tagCounts)}`);
    }
}