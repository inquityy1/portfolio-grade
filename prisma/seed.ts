import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Orgs
  const [orgA, orgB] = await Promise.all([
    prisma.organization.upsert({
      where: { id: 'org-a' },
      update: {},
      create: { id: 'org-a', name: 'Org A' },
    }),
    prisma.organization.upsert({
      where: { id: 'org-b' },
      update: {},
      create: { id: 'org-b', name: 'Org B' },
    }),
  ]);

  // Users
  async function ensureUser(email: string, name: string, rawPw: string) {
    const hashed = await bcrypt.hash(rawPw, 10);
    const user = await prisma.user.upsert({
      where: { email }, // unique
      update: { name, password: hashed }, // <-- force update of name + password
      create: { email, name, password: hashed },
    });
    console.log('✔ user', user.email, '→ name:', user.name);
    return user;
  }

  const adminA = await ensureUser('adminA@example.com', 'Admin A', 'admin123');
  const editorA = await ensureUser('editorA@example.com', 'Editor A', 'editor123');
  const viewerA = await ensureUser('viewerA@example.com', 'Viewer A', 'viewer123');

  // Org B users
  const adminB = await ensureUser('adminB@example.com', 'Admin B', 'admin123');
  const editorB = await ensureUser('editorB@example.com', 'Editor B', 'editor123');

  // Memberships (RBAC)
  await Promise.all([
    // Org A memberships
    prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: adminA.id } },
      update: {},
      create: { organizationId: orgA.id, userId: adminA.id, role: 'OrgAdmin' },
    }),
    prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: editorA.id } },
      update: {},
      create: { organizationId: orgA.id, userId: editorA.id, role: 'Editor' },
    }),
    prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: viewerA.id } },
      update: {},
      create: { organizationId: orgA.id, userId: viewerA.id, role: 'Viewer' },
    }),
    // Org B memberships
    prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgB.id, userId: adminB.id } },
      update: {},
      create: { organizationId: orgB.id, userId: adminB.id, role: 'OrgAdmin' },
    }),
    prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgB.id, userId: editorB.id } },
      update: {},
      create: { organizationId: orgB.id, userId: editorB.id, role: 'Editor' },
    }),
  ]);

  // Tags
  const [tagNews, tagDev, tagTech, tagBusiness] = await Promise.all([
    // Org A tags
    prisma.tag.upsert({
      where: { organizationId_name: { organizationId: orgA.id, name: 'news' } },
      update: {},
      create: { organizationId: orgA.id, name: 'news' },
    }),
    prisma.tag.upsert({
      where: { organizationId_name: { organizationId: orgA.id, name: 'dev' } },
      update: {},
      create: { organizationId: orgA.id, name: 'dev' },
    }),
    // Org B tags
    prisma.tag.upsert({
      where: { organizationId_name: { organizationId: orgB.id, name: 'tech' } },
      update: {},
      create: { organizationId: orgB.id, name: 'tech' },
    }),
    prisma.tag.upsert({
      where: { organizationId_name: { organizationId: orgB.id, name: 'business' } },
      update: {},
      create: { organizationId: orgB.id, name: 'business' },
    }),
  ]);

  // Post + first revision + tags + one comment
  const post = await prisma.post.create({
    data: {
      organizationId: orgA.id,
      authorId: adminA.id,
      title: 'Welcome to Our Platform',
      content:
        "This is our first post! We're excited to share updates and news with our community. Stay tuned for more content coming soon.",
      version: 1,
      revisions: {
        create: [
          {
            version: 1,
            content:
              "This is our first post! We're excited to share updates and news with our community. Stay tuned for more content coming soon.",
          },
        ],
      },
      postTags: {
        create: [{ tagId: tagNews.id }, { tagId: tagDev.id }],
      },
      comments: {
        create: [
          { authorId: editorA.id, content: 'Great first post! Looking forward to more updates.' },
        ],
      },
    },
    include: { revisions: true, comments: true, postTags: { include: { tag: true } } },
  });

  // Form + fields + one submission
  const form = await prisma.form.create({
    data: {
      organizationId: orgA.id,
      name: 'Contact Us',
      schema: {
        type: 'object',
        properties: { name: { type: 'string' }, message: { type: 'string' } },
      },
      fields: {
        create: [
          { label: 'Name', type: 'input', order: 1 },
          { label: 'Message', type: 'textarea', order: 2 },
        ],
      },
    },
    include: { fields: true },
  });

  const submission = await prisma.submission.create({
    data: { formId: form.id, data: { name: 'Alice', message: 'Hello!' } },
  });

  // Org B Post + first revision + tags + one comment
  const postB = await prisma.post.create({
    data: {
      organizationId: orgB.id,
      authorId: adminB.id,
      title: 'Welcome to Org B Platform',
      content:
        'This is our first post in Org B! We focus on technology and business solutions. Excited to share our journey with you.',
      version: 1,
      revisions: {
        create: [
          {
            version: 1,
            content:
              'This is our first post in Org B! We focus on technology and business solutions. Excited to share our journey with you.',
          },
        ],
      },
      postTags: {
        create: [{ tagId: tagTech.id }, { tagId: tagBusiness.id }],
      },
      comments: {
        create: [
          {
            authorId: editorB.id,
            content: 'Excellent introduction! Looking forward to more tech insights.',
          },
        ],
      },
    },
    include: { revisions: true, comments: true, postTags: { include: { tag: true } } },
  });

  // Org B Form + fields + one submission
  const formB = await prisma.form.create({
    data: {
      organizationId: orgB.id,
      name: 'Tech Support Request',
      schema: {
        type: 'object',
        properties: { issue: { type: 'string' }, priority: { type: 'string' } },
      },
      fields: {
        create: [
          { label: 'Issue Description', type: 'textarea', order: 1 },
          { label: 'Priority Level', type: 'select', order: 2 },
        ],
      },
    },
    include: { fields: true },
  });

  const submissionB = await prisma.submission.create({
    data: { formId: formB.id, data: { issue: 'Login problem', priority: 'High' } },
  });

  // File assets (polymorphic via separate FKs)
  await Promise.all([
    // Org A file assets
    prisma.fileAsset.create({
      data: { url: 'https://example.com/post.png', mimeType: 'image/png', postId: post.id },
    }),
    prisma.fileAsset.create({
      data: {
        url: 'https://example.com/submission.txt',
        mimeType: 'text/plain',
        submissionId: submission.id,
      },
    }),
    // Org B file assets
    prisma.fileAsset.create({
      data: { url: 'https://example.com/post-b.png', mimeType: 'image/png', postId: postB.id },
    }),
    prisma.fileAsset.create({
      data: {
        url: 'https://example.com/submission-b.txt',
        mimeType: 'text/plain',
        submissionId: submissionB.id,
      },
    }),
  ]);

  // Audit logs
  await prisma.auditLog.createMany({
    data: [
      // Org A audit logs
      {
        organizationId: orgA.id,
        userId: adminA.id,
        action: 'POST_CREATED',
        resource: 'Post',
        resourceId: post.id,
      },
      {
        organizationId: orgA.id,
        userId: editorA.id,
        action: 'COMMENT_CREATED',
        resource: 'Comment',
        resourceId: post.comments[0].id,
      },
      {
        organizationId: orgA.id,
        userId: adminA.id,
        action: 'FORM_CREATED',
        resource: 'Form',
        resourceId: form.id,
      },
      // Org B audit logs
      {
        organizationId: orgB.id,
        userId: adminB.id,
        action: 'POST_CREATED',
        resource: 'Post',
        resourceId: postB.id,
      },
      {
        organizationId: orgB.id,
        userId: editorB.id,
        action: 'COMMENT_CREATED',
        resource: 'Comment',
        resourceId: postB.comments[0].id,
      },
      {
        organizationId: orgB.id,
        userId: adminB.id,
        action: 'FORM_CREATED',
        resource: 'Form',
        resourceId: formB.id,
      },
    ],
  });

  // TagAggregate - simulate some tag usage statistics
  await Promise.all([
    // Org A tag aggregates
    prisma.tagAggregate.upsert({
      where: { organizationId_tagId: { organizationId: orgA.id, tagId: tagNews.id } },
      update: { count: 1, calculatedAt: new Date() },
      create: { organizationId: orgA.id, tagId: tagNews.id, count: 1 },
    }),
    prisma.tagAggregate.upsert({
      where: { organizationId_tagId: { organizationId: orgA.id, tagId: tagDev.id } },
      update: { count: 1, calculatedAt: new Date() },
      create: { organizationId: orgA.id, tagId: tagDev.id, count: 1 },
    }),
    // Org B tag aggregates
    prisma.tagAggregate.upsert({
      where: { organizationId_tagId: { organizationId: orgB.id, tagId: tagTech.id } },
      update: { count: 1, calculatedAt: new Date() },
      create: { organizationId: orgB.id, tagId: tagTech.id, count: 1 },
    }),
    prisma.tagAggregate.upsert({
      where: { organizationId_tagId: { organizationId: orgB.id, tagId: tagBusiness.id } },
      update: { count: 1, calculatedAt: new Date() },
      create: { organizationId: orgB.id, tagId: tagBusiness.id, count: 1 },
    }),
  ]);

  console.log('Seed complete:', {
    orgA: orgA.name,
    postA: post.title,
    formA: form.name,
    orgB: orgB.name,
    postB: postB.title,
    formB: formB.name,
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
