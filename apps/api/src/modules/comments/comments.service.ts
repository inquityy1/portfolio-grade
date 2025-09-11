import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { OutboxService } from '../../infra/outbox.service';

@Injectable()
export class CommentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService
    ) { }

    async list(orgId: string, postId: string) {
        const post = await this.prisma.post.findFirst({ where: { id: postId, organizationId: orgId }, select: { id: true } });
        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.comment.findMany({
            where: { postId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true, authorId: true, content: true, createdAt: true },
        });
    }

    async create(orgId: string, postId: string, userId: string, content: string) {
        return this.prisma.$transaction(async (tx) => {
            const post = await tx.post.findFirst({ where: { id: postId, organizationId: orgId }, select: { id: true } });
            if (!post) throw new NotFoundException('Post not found');

            const comment = await tx.comment.create({
                data: { postId, authorId: userId, content },
                select: { id: true, authorId: true, content: true, createdAt: true },
            });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'COMMENT_CREATED',
                    resource: 'Comment',
                    resourceId: comment.id,
                },
            });

            await this.outbox.publish('comment.created', { id: comment.id, postId, orgId });

            return comment;
        });
    }

    async update(orgId: string, commentId: string, userId: string, content: string) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findFirst({
                where: { id: commentId, post: { organizationId: orgId } },
                select: { id: true, authorId: true, deletedAt: true },
            });
            if (!comment) throw new NotFoundException('Comment not found');
            if (comment.deletedAt) throw new ForbiddenException('Cannot edit a deleted comment');

            const membership = await tx.membership.findUnique({
                where: { organizationId_userId: { organizationId: orgId, userId } },
                select: { role: true },
            });
            if (!membership) throw new ForbiddenException('No membership for this organization');

            const isAdmin = membership.role === 'OrgAdmin';
            const isEditor = membership.role === 'Editor';
            const isAuthor = comment.authorId === userId;
            if (!(isAuthor || isEditor || isAdmin)) {
                throw new ForbiddenException('Not allowed to edit this comment');
            }

            const updated = await tx.comment.update({
                where: { id: commentId },
                data: { content },
                select: { id: true, authorId: true, content: true, createdAt: true },
            });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'COMMENT_UPDATED',
                    resource: 'Comment',
                    resourceId: commentId,
                },
            });

            await this.outbox.publish('comment.updated', { id: commentId, orgId });

            return updated;
        });
    }

    async remove(orgId: string, commentId: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findFirst({
                where: { id: commentId, post: { organizationId: orgId } },
                select: { id: true, authorId: true, deletedAt: true },
            });
            if (!comment) throw new NotFoundException('Comment not found');
            if (comment.deletedAt) return { ok: true };

            // author OR Editor/Admin
            const membership = await tx.membership.findUnique({
                where: { organizationId_userId: { organizationId: orgId, userId } },
                select: { role: true },
            });
            if (!membership) throw new ForbiddenException('No membership for this organization');

            const isAdmin = membership.role === 'OrgAdmin';
            const isEditor = membership.role === 'Editor';
            const isAuthor = comment.authorId === userId;
            if (!(isAuthor || isEditor || isAdmin)) throw new ForbiddenException('Not allowed to delete this comment');

            await tx.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'COMMENT_DELETED',
                    resource: 'Comment',
                    resourceId: commentId,
                },
            });

            await this.outbox.publish('comment.deleted', { id: commentId, orgId });

            return { ok: true };
        });
    }

    async restore(orgId: string, commentId: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findFirst({
                where: { id: commentId, post: { organizationId: orgId } },
                select: { id: true, deletedAt: true },
            });
            if (!comment) throw new NotFoundException('Comment not found');
            if (!comment.deletedAt) return { ok: true }; // already active

            // Only Editor/Admin can restore
            const membership = await tx.membership.findUnique({
                where: { organizationId_userId: { organizationId: orgId, userId } },
                select: { role: true },
            });
            if (!membership) throw new ForbiddenException('No membership for this organization');
            const isAdminOrEditor = membership.role === 'OrgAdmin' || membership.role === 'Editor';
            if (!isAdminOrEditor) throw new ForbiddenException('Only Editor or OrgAdmin can restore comments');

            await tx.comment.update({ where: { id: commentId }, data: { deletedAt: null } });

            await tx.auditLog.create({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'COMMENT_RESTORED',
                    resource: 'Comment',
                    resourceId: commentId,
                },
            });

            await this.outbox.publish('comment.restored', { id: commentId, orgId });

            return { ok: true };
        });
    }
}