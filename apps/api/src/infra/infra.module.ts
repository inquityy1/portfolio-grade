import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';

@Module({
    providers: [RedisService, PrismaService],
    exports: [RedisService, PrismaService],
})
export class InfraModule { }
