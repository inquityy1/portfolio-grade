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

@Injectable()
export class OrgAdminOnlyGuard implements CanActivate {
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

    // Check if user has OrgAdmin role in ANY organization
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.userId },
      select: { role: true },
    });

    if (memberships.length === 0) {
      throw new ForbiddenException('No organization memberships found');
    }

    // Check if user has at least one membership with a role that meets the requirement
    const needed = Math.max(...required.map(r => ROLE_HIERARCHY[r]));
    const hasRequiredRole = memberships.some(
      membership => ROLE_HIERARCHY[membership.role] >= needed,
    );

    if (!hasRequiredRole) throw new ForbiddenException('Insufficient role in any organization');

    return true;
  }
}
