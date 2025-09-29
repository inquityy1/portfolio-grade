import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';
import { OutboxService } from '../../infra/services/outbox.service';
import * as bcrypt from 'bcrypt';
type Role = 'OrgAdmin' | 'Editor' | 'Viewer';

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

    async createUserWithMembership(orgId: string, data: { email: string; password: string; name: string; role: Role; organizationId?: string }) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Use provided organizationId or fallback to current orgId
        const targetOrgId = data.organizationId || orgId;

        // Create user and membership in a transaction
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                },
            });

            await tx.membership.create({
                data: {
                    organizationId: targetOrgId,
                    userId: user.id,
                    role: data.role,
                },
            });

            await this.outbox.publish('user.created', { id: user.id, name: data.name });

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: data.role,
                createdAt: user.createdAt,
            };
        });
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