import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { RedisService } from '../../infra/services/redis.service';
import * as crypto from 'crypto';

function stableQS(query: Record<string, any>) {
    const entries = Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return new URLSearchParams(entries as any).toString();
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    private readonly ttlSeconds = Number(process.env.CACHE_TTL ?? 60);

    constructor(private readonly redis: RedisService) { }

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const enabled = process.env.CACHE_ENABLED !== 'false';
        if (!enabled) return next.handle();

        const req = ctx.switchToHttp().getRequest();
        if (req.method !== 'GET') return next.handle();

        const orgId = req.headers['x-org-id'] as string | undefined;
        if (!orgId) return next.handle();

        const qs = stableQS(req.query ?? {});
        const rawKey = `org:${orgId}:posts:list:${qs}`;
        const key = `cache:${crypto.createHash('sha1').update(rawKey).digest('hex')}`;

        return from(this.redis.get(key)).pipe(
            switchMap((cached) => {
                if (cached) return of(cached);
                return next.handle().pipe(
                    tap((data) => {
                        this.redis.set(key, data, this.ttlSeconds).catch(() => { });
                    })
                );
            })
        );
    }
}