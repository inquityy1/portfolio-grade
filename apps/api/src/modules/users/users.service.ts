import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { OutboxService } from '../../infra/outbox.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService
    ) { }

    findAllByOrg(orgId: string) {
        return this.prisma.user.findMany({
            where: { memberships: { some: { organizationId: orgId } } },
            select: { id: true, email: true, name: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
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

    async create(data: any) {
        const user = await this.prisma.user.create({ data });
        await this.outbox.publish('user.created', { id: user.id, name: data.name });
        return user;
    }

    async update(id: string, orgId: string, data: any) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                id,
                memberships: { some: { organizationId: orgId } }
            }
        });

        if (!existingUser) {
            throw new NotFoundException('User not found in this organization');
        }

        const user = await this.prisma.user.update({ where: { id }, data });
        await this.outbox.publish('user.updated', { id, name: data.name });
        return user;
    }

    async remove(id: string) {
        await this.outbox.publish('user.deleted', { id });
        return this.prisma.user.delete({ where: { id } });
    }
}