import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../infra/services/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { ROLE_HIERARCHY } from '@portfolio-grade/shared';

const HEADER = process.env.TENANT_HEADER || 'X-Org-Id';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { userId: string; email: string } | undefined;
    if (!user) throw new UnauthorizedException('Missing JWT user');

    const orgId = request.headers[HEADER.toLowerCase()] as string | undefined;
    if (!orgId) throw new ForbiddenException(`Missing tenant header "${HEADER}"`);

    // fetch membership for this org+user
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.userId } },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('No membership for this organization');
    }

    // hierarchical permission (OrgAdmin >= Editor >= Viewer)
    const needed = Math.max(...required.map(r => ROLE_HIERARCHY[r]));
    const have = ROLE_HIERARCHY[membership.role];
    const ok = have >= needed;

    if (!ok) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
