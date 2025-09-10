import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { RedisService } from '../../infra/redis.service';

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    // list(orgId: string) {
    //     return this.prisma.post.findMany({
    //         where: { organizationId: orgId },
    //         orderBy: { updatedAt: 'desc' },
    //         select: {
    //             id: true, title: true, version: true, updatedAt: true,
    //             postTags: { select: { tag: { select: { id: true, name: true } } } }
    //         },
    //     });
    // }

    async list(
        orgId: string,
        opts: { limit?: number; cursor?: string | null; q?: string | null; tagId?: string | null } = {}
    ) {
        const take = Math.min(Math.max(opts.limit ?? 10, 1), 50);

        const where: any = { organizationId: orgId };
        if (opts.q) {
            where.OR = [
                { title: { contains: opts.q, mode: 'insensitive' } },
                { content: { contains: opts.q, mode: 'insensitive' } },
            ];
        }
        if (opts.tagId) {
            where.postTags = { some: { tagId: opts.tagId } };
        }

        const items = await this.prisma.post.findMany({
            where,
            take: take + 1,
            ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                title: true,
                content: true,
                version: true,
                createdAt: true,
                updatedAt: true,
                postTags: { select: { tag: { select: { id: true, name: true } } } },
            },
        });

        let nextCursor: string | null = null;
        if (items.length > take) {
            const next = items.pop()!;
            nextCursor = next.id;
        }

        return { items, nextCursor };
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

    private async invalidateLists(orgId: string) {
        await this.redis.delByPrefix(`cache:`);
        // await this.redis.delByPrefix(`cache:`) // if you embed org in the hashed key, you need to store a parallel index.
    }

    // CRUD Posts
    async create(orgId: string, authorId: string, data: { title: string; content: string; tagIds?: string[] }) {
        const tagIds = data.tagIds ?? [];
        if (tagIds.length) {
            const count = await this.prisma.tag.count({ where: { id: { in: tagIds }, organizationId: orgId } });
            if (count !== tagIds.length) throw new ForbiddenException('One or more tags do not belong to this organization');
        }

        return this.prisma.$transaction(async (tx) => {
            const post = await tx.post.create({
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

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId: authorId,
                    action: 'POST_CREATED',
                    resource: 'Post',
                    resourceId: post.id,
                },
            });

            await this.invalidateLists(orgId);

            return post;
        });
    }

    async update(
        orgId: string,
        id: string,
        userId: string,
        dto: { version: number; title?: string; content?: string; tagIds?: string[] }
    ) {
        const tagIds = dto.tagIds ?? [];

        return await this.prisma.$transaction(async (tx) => {
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

            const updated = await tx.post.updateMany({
                where: { id, organizationId: orgId, version: dto.version },
                data: {
                    title: dto.title ?? undefined,
                    content: dto.content ?? undefined,
                    version: { increment: 1 },
                },
            });
            if (updated.count === 0) throw new ConflictException('Version conflict — please refresh and retry');

            if (tagIds.length) {
                const count = await tx.tag.count({ where: { id: { in: tagIds }, organizationId: orgId } });
                if (count !== tagIds.length) throw new ForbiddenException('One or more tags do not belong to this organization');

                await tx.postTag.deleteMany({ where: { postId: id } });
                await tx.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: id, tagId })) });
            }

            if (dto.content) {
                const fresh = await tx.post.findUnique({ where: { id }, select: { version: true } });
                await tx.revision.create({ data: { postId: id, version: fresh!.version, content: dto.content } });
            }

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'POST_UPDATED',
                    resource: 'Post',
                    resourceId: id,
                },
            });

            await this.invalidateLists(orgId);

            return tx.post.findFirst({
                where: { id, organizationId: orgId },
                include: {
                    postTags: { include: { tag: true } },
                    revisions: { orderBy: { version: 'desc' }, take: 1 },
                },
            });
        });
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

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'POST_DELETED',
                    resource: 'Post',
                    resourceId: id,
                },
            });

            await this.invalidateLists(orgId);

            return { ok: true };
        });
    }

    // Revisions
    async listRevisions(orgId: string, postId: string) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, organizationId: orgId },
            select: { id: true },
        });
        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.revision.findMany({
            where: { postId },
            orderBy: { version: 'desc' },
            select: { version: true, createdAt: true },
        });
    }

    async getRevision(orgId: string, postId: string, version: number) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, organizationId: orgId },
            select: { id: true },
        });
        if (!post) throw new NotFoundException('Post not found');

        const rev = await this.prisma.revision.findUnique({
            where: { postId_version: { postId, version } },
            select: { postId: true, version: true, content: true, createdAt: true },
        });
        if (!rev) throw new NotFoundException('Revision not found');

        return rev;
    }

    async rollbackToRevision(orgId: string, postId: string, userId: string, version: number) {
        return this.prisma.$transaction(async (tx) => {
            const [post, membership, rev] = await Promise.all([
                tx.post.findFirst({
                    where: { id: postId, organizationId: orgId },
                    select: { id: true, authorId: true, version: true },
                }),
                tx.membership.findUnique({
                    where: { organizationId_userId: { organizationId: orgId, userId } },
                    select: { role: true },
                }),
                tx.revision.findUnique({
                    where: { postId_version: { postId, version } },
                    select: { version: true, content: true },
                }),
            ]);

            if (!post) throw new NotFoundException('Post not found');
            if (!membership) throw new ForbiddenException('No membership for this organization');
            if (!rev) throw new NotFoundException('Revision not found');

            const isAdmin = membership.role === 'OrgAdmin';
            const isEditor = membership.role === 'Editor';
            const isAuthor = post.authorId === userId;

            if (!(isAdmin || isEditor || isAuthor)) {
                throw new ForbiddenException('Only author, Editor, or OrgAdmin can rollback this post');
            }

            const nextVersion = post.version + 1;

            await tx.post.update({
                where: { id: postId },
                data: { content: rev.content, version: nextVersion },
            });

            await tx.revision.create({
                data: { postId, version: nextVersion, content: rev.content },
            });

            await this.invalidateLists(orgId);

            return tx.post.findFirst({
                where: { id: postId },
                include: {
                    postTags: { include: { tag: true } },
                    revisions: { orderBy: { version: 'desc' }, take: 1 },
                },
            });
        });
    }
}