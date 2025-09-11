import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';
import { OutboxService } from './outbox.service';
import { DispatcherService } from './dispatcher.service';
import { RateLimitService } from './rate-limit.service';

@Module({
    providers: [RedisService, PrismaService, OutboxService, DispatcherService, RateLimitService],
    exports: [RedisService, PrismaService, OutboxService, RateLimitService],
})
export class InfraModule { }
