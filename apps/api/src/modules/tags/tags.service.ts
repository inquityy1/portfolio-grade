import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class TagsService {
    constructor(private readonly prisma: PrismaService) { }

    list(orgId: string) {
        return this.prisma.tag.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        });
    }

    async create(orgId: string, name: string) {
        try {
            return await this.prisma.tag.create({
                data: { organizationId: orgId, name },
                select: { id: true, name: true },
            });
        } catch (e: any) {
            // unique(organizationId, name)
            if (e.code === 'P2002') throw new ConflictException('Tag name already exists in this org');
            throw e;
        }
    }

    async update(orgId: string, id: string, data: { name?: string }) {
        // ensure tag belongs to this org
        const exists = await this.prisma.tag.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
        if (!exists) throw new NotFoundException('Tag not found');

        try {
            return await this.prisma.tag.update({
                where: { id },
                data,
                select: { id: true, name: true },
            });
        } catch (e: any) {
            if (e.code === 'P2002') throw new ConflictException('Tag name already exists in this org');
            throw e;
        }
    }

    async remove(orgId: string, id: string) {
        // ensure tag belongs to this org
        const exists = await this.prisma.tag.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
        if (!exists) throw new NotFoundException('Tag not found');

        await this.prisma.tag.delete({ where: { id } });
        return { ok: true };
    }
}