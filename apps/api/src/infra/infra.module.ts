import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { PrismaService } from './services/prisma.service';
import { OutboxService } from './services/outbox.service';
import { DispatcherService } from './services/dispatcher.service';
import { RateLimitService } from './services/rate-limit.service';
import { QueueService } from './services/queue.service';
import { TagStatsProcessor } from './jobs/processors/tag-stats.processor';
import { PostPreviewProcessor } from './jobs/processors/post-preview.processor';

@Module({
    providers: [
        RedisService,
        PrismaService,
        OutboxService,
        DispatcherService,
        RateLimitService,
        QueueService,
        TagStatsProcessor,
        PostPreviewProcessor
    ],
    exports: [
        RedisService,
        PrismaService,
        OutboxService,
        RateLimitService,
        QueueService,
        TagStatsProcessor,
        PostPreviewProcessor
    ],
})
export class InfraModule { }
