import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    list(orgId: string) {
        return this.prisma.post.findMany({
            where: { organizationId: orgId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true, title: true, version: true, updatedAt: true,
                postTags: { select: { tag: { select: { id: true, name: true } } } }
            },
        });
    }

    async getOne(orgId: string, id: string) {
        const post = await this.prisma.post.findFirst({
            where: { id, organizationId: orgId },
            include: {
                postTags: { include: { tag: true } },
                revisions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async create(orgId: string, authorId: string, data: { title: string; content: string; tagIds?: string[] }) {
        // ensure tags belong to this org (if provided)
        const tagIds = data.tagIds ?? [];
        if (tagIds.length) {
            const count = await this.prisma.tag.count({ where: { id: { in: tagIds }, organizationId: orgId } });
            if (count !== tagIds.length) throw new ForbiddenException('One or more tags do not belong to this organization');
        }

        return this.prisma.$transaction(async (tx) => {
            const created = await tx.post.create({
                data: {
                    organizationId: orgId,
                    authorId,
                    title: data.title,
                    content: data.content,
                    version: 1,
                    revisions: { create: [{ version: 1, content: data.content }] },
                    postTags: tagIds.length ? { createMany: { data: tagIds.map((tagId) => ({ tagId })) } } : undefined,
                },
                include: { postTags: { include: { tag: true } }, revisions: true },
            });
            return created;
        });
    }

    async update(
        orgId: string,
        id: string,
        userId: string,
        dto: { version: number; title?: string; content?: string; tagIds?: string[] }
    ) {
        const tagIds = dto.tagIds ?? [];

        const updated = await this.prisma.$transaction(async (tx) => {
            // fetch post + membership (role) in parallel
            const [existing, membership] = await Promise.all([
                tx.post.findFirst({
                    where: { id, organizationId: orgId },
                    select: { id: true, authorId: true },
                }),
                tx.membership.findUnique({
                    where: { organizationId_userId: { organizationId: orgId, userId } },
                    select: { role: true },
                }),
            ]);

            if (!existing) throw new NotFoundException('Post not found');
            if (!membership) throw new ForbiddenException('No membership for this organization');

            const isAdmin = membership.role === 'OrgAdmin';
            const isAuthor = existing.authorId === userId;
            if (!isAdmin && !isAuthor) {
                throw new ForbiddenException('Only the author or an OrgAdmin can edit this post');
            }

            // optimistic update (version match)
            const updated = await tx.post.updateMany({
                where: { id, organizationId: orgId, version: dto.version },
                data: {
                    title: dto.title ?? undefined,
                    content: dto.content ?? undefined,
                    version: { increment: 1 },
                },
            });
            if (updated.count === 0) throw new ConflictException('Version conflict — please refresh and retry');

            // optional tag replace
            if (tagIds.length) {
                const count = await tx.tag.count({ where: { id: { in: tagIds }, organizationId: orgId } });
                if (count !== tagIds.length) throw new ForbiddenException('One or more tags do not belong to this organization');

                await tx.postTag.deleteMany({ where: { postId: id } });
                await tx.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: id, tagId })) });
            }

            // add new revision if content changed
            if (dto.content) {
                const fresh = await tx.post.findUnique({ where: { id }, select: { version: true } });
                await tx.revision.create({ data: { postId: id, version: fresh!.version, content: dto.content } });
            }

            return tx.post.findFirst({
                where: { id, organizationId: orgId },
                include: {
                    postTags: { include: { tag: true } },
                    revisions: { orderBy: { version: 'desc' }, take: 1 },
                },
            });
        });

        return updated;
    }

    async remove(orgId: string, id: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const [existing, membership] = await Promise.all([
                tx.post.findFirst({ where: { id, organizationId: orgId }, select: { id: true, authorId: true } }),
                tx.membership.findUnique({
                    where: { organizationId_userId: { organizationId: orgId, userId } },
                    select: { role: true },
                }),
            ]);

            if (!existing) throw new NotFoundException('Post not found');
            if (!membership) throw new ForbiddenException('No membership for this organization');

            const isAdmin = membership.role === 'OrgAdmin';
            const isAuthor = existing.authorId === userId;
            if (!isAdmin && !isAuthor) {
                throw new ForbiddenException('Only the author or an OrgAdmin can delete this post');
            }

            await tx.post.delete({ where: { id } });
            return { ok: true };
        });
    }
}