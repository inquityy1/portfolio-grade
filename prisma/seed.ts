import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Orgs
    const [orgA] = await Promise.all([
        prisma.organization.upsert({
            where: { id: 'org-a' },
            update: {},
            create: { id: 'org-a', name: 'Org A' }
        })
    ]);

    // Users
    const [adminA, editorA, viewerA] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'adminA@example.com' },
            update: {},
            create: { email: 'adminA@example.com', password: 'hashed' }
        }),
        prisma.user.upsert({
            where: { email: 'editorA@example.com' },
            update: {},
            create: { email: 'editorA@example.com', password: 'hashed' }
        }),
        prisma.user.upsert({
            where: { email: 'viewerA@example.com' },
            update: {},
            create: { email: 'viewerA@example.com', password: 'hashed' }
        }),
    ]);

    // Memberships (RBAC)
    await Promise.all([
        prisma.membership.upsert({
            where: { organizationId_userId: { organizationId: orgA.id, userId: adminA.id } },
            update: {},
            create: { organizationId: orgA.id, userId: adminA.id, role: Role.OrgAdmin }
        }),
        prisma.membership.upsert({
            where: { organizationId_userId: { organizationId: orgA.id, userId: editorA.id } },
            update: {},
            create: { organizationId: orgA.id, userId: editorA.id, role: Role.Editor }
        }),
        prisma.membership.upsert({
            where: { organizationId_userId: { organizationId: orgA.id, userId: viewerA.id } },
            update: {},
            create: { organizationId: orgA.id, userId: viewerA.id, role: Role.Viewer }
        }),
    ]);

    // Tags
    const [tagNews, tagDev] = await Promise.all([
        prisma.tag.upsert({
            where: { organizationId_name: { organizationId: orgA.id, name: 'news' } },
            update: {},
            create: { organizationId: orgA.id, name: 'news' }
        }),
        prisma.tag.upsert({
            where: { organizationId_name: { organizationId: orgA.id, name: 'dev' } },
            update: {},
            create: { organizationId: orgA.id, name: 'dev' }
        }),
    ]);

    // Post + first revision + tags + one comment
    const post = await prisma.post.create({
        data: {
            organizationId: orgA.id,
            authorId: adminA.id,
            title: 'Hello World Post',
            content: 'Initial content',
            version: 1,
            revisions: {
                create: [{ version: 1, content: 'Initial content (rev 1)' }]
            },
            postTags: {
                create: [{ tagId: tagNews.id }, { tagId: tagDev.id }]
            },
            comments: {
                create: [{ authorId: editorA.id, content: 'Looks good!' }]
            }
        },
        include: { revisions: true, comments: true, postTags: { include: { tag: true } } }
    });

    // Form + fields + one submission
    const form = await prisma.form.create({
        data: {
            organizationId: orgA.id,
            name: 'Contact Us',
            schema: { type: 'object', properties: { name: { type: 'string' }, message: { type: 'string' } } },
            fields: {
                create: [
                    { label: 'Name', type: 'input', order: 1 },
                    { label: 'Message', type: 'textarea', order: 2 }
                ]
            }
        },
        include: { fields: true }
    });

    const submission = await prisma.submission.create({
        data: { formId: form.id, data: { name: 'Alice', message: 'Hello!' } }
    });

    // File assets (polymorphic via separate FKs)
    await Promise.all([
        prisma.fileAsset.create({ data: { url: 'https://example.com/post.png', mimeType: 'image/png', postId: post.id } }),
        prisma.fileAsset.create({ data: { url: 'https://example.com/submission.txt', mimeType: 'text/plain', submissionId: submission.id } }),
    ]);

    // Audit logs
    await prisma.auditLog.createMany({
        data: [
            { organizationId: orgA.id, userId: adminA.id, action: 'POST_CREATED', resource: 'Post', resourceId: post.id },
            { organizationId: orgA.id, userId: editorA.id, action: 'COMMENT_CREATED', resource: 'Comment', resourceId: post.comments[0].id },
            { organizationId: orgA.id, userId: adminA.id, action: 'FORM_CREATED', resource: 'Form', resourceId: form.id }
        ]
    });

    console.log('Seed complete:', { org: orgA.name, post: post.title, form: form.name });
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });