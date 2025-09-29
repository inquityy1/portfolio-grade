import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../infra/services/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

type Role = 'OrgAdmin' | 'Editor' | 'Viewer';

@Injectable()
export class OrgAdminOnlyGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

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

        // Check if user has OrgAdmin role in at least one organization
        const hasOrgAdminRole = memberships.some(membership =>
            membership.role === 'OrgAdmin'
        );

        if (!hasOrgAdminRole) {
            throw new ForbiddenException('User must have OrgAdmin role in at least one organization to manage organizations');
        }

        return true;
    }
}
