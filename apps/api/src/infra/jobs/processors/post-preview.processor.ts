import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../../services/queue.service';
import { PrismaService } from '../../services/prisma.service';
import { QUEUE_POST_PREVIEW, PostPreviewJob } from '../types';
import { Job } from 'bullmq';

@Injectable()
export class PostPreviewProcessor implements OnModuleInit {
    private readonly logger = new Logger(PostPreviewProcessor.name);

    constructor(
        private readonly queues: QueueService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        const ok = this.queues.registerWorker(
            QUEUE_POST_PREVIEW,
            async (job: Job<PostPreviewJob>) => {
                const { orgId, postId } = job.data as PostPreviewJob;
                await this.generate(orgId, postId);
            },
            2,
        );
        if (!ok) this.logger.warn('Redis unavailable; PostPreview worker not registered.');
    }

    async enqueue(orgId: string, postId: string) {
        return await this.queues.add<PostPreviewJob>(QUEUE_POST_PREVIEW, 'generate', { orgId, postId });
    }

    private async generate(orgId: string, postId: string) {
        // confirm post belongs to org
        const post = await this.prisma.post.findFirst({ where: { id: postId, organizationId: orgId } });
        if (!post) return;

        const url = `https://picsum.photos/seed/${postId}/1200/630`;

        // attach or replace a "preview" FileAsset (simple approach: allow multiple)
        await this.prisma.fileAsset.create({
            data: { url, mimeType: 'image/jpeg', postId },
        });

        this.logger.log(`[post-preview] generated for post=${postId}`);
    }
}