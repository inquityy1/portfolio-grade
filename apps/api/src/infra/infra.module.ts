import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';
import { OutboxService } from './outbox.service';
import { DispatcherService } from './dispatcher.service';
import { RateLimitService } from './rate-limit.service';
import { QueueService } from './queue.service';
import { TagStatsProcessor } from './jobs/processors/tag-stats.processor';

@Module({
    providers: [RedisService, PrismaService, OutboxService, DispatcherService, RateLimitService, QueueService, TagStatsProcessor],
    exports: [RedisService, PrismaService, OutboxService, RateLimitService, QueueService, TagStatsProcessor],
})
export class InfraModule { }
