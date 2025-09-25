import {
    CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../infra/services/rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitConfig } from '../decorators/rate-limit.decorator';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly limiter: RateLimitService,
    ) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest<Request>();
        const res = ctx.switchToHttp().getResponse();

        const cfg =
            this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, ctx.getHandler()) ??
            this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, ctx.getClass()) ??
            // defaults if nothing specified:
            { perUser: { limit: 60, windowSec: 10 }, perOrg: { limit: 600, windowSec: 60 } };

        const orgId = (req.headers['x-org-id'] as string) || (req as any).orgId || 'no-org';
        const userId = (req as any).user?.userId || 'anon';
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';

        const routeKey = `${req.method}:${req.baseUrl || ''}${req.path || ''}`;

        const checks: Array<Promise<{ scope: string; res: any }>> = [];

        if (cfg.perUser) {
            const key = `user:${userId}:${routeKey}`;
            checks.push(this.limiter.hit(key, cfg.perUser.limit, cfg.perUser.windowSec).then(r => ({ scope: 'user', res: r })));
        }

        if (cfg.perOrg) {
            const key = `org:${orgId}:${routeKey}`;
            checks.push(this.limiter.hit(key, cfg.perOrg.limit, cfg.perOrg.windowSec).then(r => ({ scope: 'org', res: r })));
        }

        if (cfg.perIp) {
            const key = `ip:${ip}:${routeKey}`;
            checks.push(this.limiter.hit(key, cfg.perIp.limit, cfg.perIp.windowSec).then(r => ({ scope: 'ip', res: r })));
        }

        const results = await Promise.all(checks);

        // If any scope blocks, throw 429; also expose headers for the *tightest* window
        let allowed = true;
        let tightest = results[0]?.res;
        for (const { res: r } of results) {
            if (r && tightest && r.resetSeconds < tightest.resetSeconds) tightest = r;
            if (r && !r.allowed) allowed = false;
        }

        if (tightest) {
            res.setHeader('X-RateLimit-Limit', String(tightest.limit));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, tightest.remaining)));
            res.setHeader('X-RateLimit-Reset', String(tightest.resetSeconds));
        }

        if (!allowed) throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        return true;
    }
}