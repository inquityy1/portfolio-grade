import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    findAllByOrg(orgId: string) {
        return this.prisma.user.findMany({
            where: { memberships: { some: { organizationId: orgId } } },
            select: { id: true, email: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneInOrg(userId: string, orgId: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                memberships: { some: { organizationId: orgId } },
            },
            select: { id: true, email: true, name: true, createdAt: true },
        });

        if (!user) throw new NotFoundException('User not found in this organization');

        return user;
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    create(data: any) {
        return this.prisma.user.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.user.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}