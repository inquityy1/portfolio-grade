import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

type HitResult = { allowed: boolean; remaining: number; limit: number; resetSeconds: number };

@Injectable()
export class RateLimitService {
    private readonly logger = new Logger(RateLimitService.name);
    private memoryStore = new Map<string, { count: number; resetAt: number }>();

    constructor(private readonly redis: RedisService) { }

    async hit(
        key: string,
        limit: number,
        windowSec: number,
    ): Promise<HitResult> {
        if (limit <= 0) return { allowed: true, remaining: limit, limit, resetSeconds: 0 };

        const client = this.redis.getClient();
        // Try Redis path
        if (client?.status === 'ready') {
            const now = Math.floor(Date.now() / 1000);
            const bucketKey = `rate:${key}:${Math.floor(now / windowSec)}`; // fixed window shard

            const multi = client.multi();
            multi.incr(bucketKey);
            multi.expire(bucketKey, windowSec, 'NX');
            const [incrRes] = (await multi.exec()) as [number, unknown];
            const count = typeof incrRes === 'number' ? incrRes : Number(incrRes);

            const remaining = Math.max(0, limit - count);
            const resetSeconds = windowSec - (now % windowSec);
            return { allowed: count <= limit, remaining, limit, resetSeconds };
        }

        // Fallback: in-memory
        const nowMs = Date.now();
        const winMs = windowSec * 1000;
        const entry = this.memoryStore.get(key);

        if (!entry || entry.resetAt <= nowMs) {
            this.memoryStore.set(key, { count: 1, resetAt: nowMs + winMs });
            return { allowed: true, remaining: limit - 1, limit, resetSeconds: Math.ceil(winMs / 1000) };
        }

        entry.count += 1;
        const remaining = Math.max(0, limit - entry.count);
        const allowed = entry.count <= limit;
        const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - nowMs) / 1000));
        return { allowed, remaining, limit, resetSeconds };
    }
}