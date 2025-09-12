import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
} from '@nestjs/common';
import { Observable, from, of, tap, switchMap } from 'rxjs';
import { PrismaService } from 'apps/api/src/infra/services/prisma.service';
import * as crypto from 'crypto';

function bodyHash(payload: any) {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
    return crypto.createHash('sha256').update(json).digest('hex');
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const req = ctx.switchToHttp().getRequest();
        const res = ctx.switchToHttp().getResponse();

        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
            return next.handle();
        }

        const orgId = req.headers['x-org-id'] as string | undefined;
        const key = req.headers['idempotency-key'] as string | undefined;
        if (!orgId || !key) {
            throw new BadRequestException('Missing X-Org-Id or Idempotency-Key');
        }

        // Route signature keeps things specific per endpoint + method
        const route = `${req.method} ${req.baseUrl || ''}${req.route?.path || req.path}`;
        const hash = bodyHash(req.body);

        return from(
            this.prisma.idempotencyKey.findUnique({
                where: { orgId_route_key: { orgId, route, key } },
                select: { bodyHash: true, response: true },
            })
        ).pipe(
            switchMap((found) => {
                if (found) {
                    if (found.bodyHash === hash && found.response != null) {
                        res.setHeader('X-Idempotency', 'HIT');
                        return of(found.response);
                    }
                    throw new BadRequestException('Idempotency-Key conflict: body differs from original request.');
                }

                return from(
                    this.prisma.idempotencyKey.create({
                        data: { orgId, route, key, bodyHash: hash },
                        select: { id: true },
                    })
                ).pipe(
                    switchMap((created) =>
                        next.handle().pipe(
                            tap(async (data) => {
                                try {
                                    await this.prisma.idempotencyKey.update({
                                        where: { id: created.id },
                                        data: { response: data },
                                    });
                                    res.setHeader('X-Idempotency', 'MISS');
                                } catch {
                                    // swallow — idempotency best-effort persistence
                                }
                            })
                        )
                    )
                );
            })
        );
    }
}