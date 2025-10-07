import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/services/prisma.service';
import { OutboxService } from '../../infra/services/outbox.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService, private readonly outbox: OutboxService) {}

  async findAll() {
    return this.prisma.organization.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async create(name: string) {
    // Check if organization with this name already exists
    const existingOrg = await this.prisma.organization.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Generate a unique ID based on the name
    const id = this.generateOrgId(name);

    // Create organization with system users and memberships
    const organization = await this.prisma.$transaction(async tx => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          id,
          name: name.trim(),
        },
        select: { id: true, name: true, createdAt: true },
      });

      // Create system users for each role
      const hashedPassword = await bcrypt.hash('system-user', 10);

      const orgAdminUser = await tx.user.create({
        data: {
          email: `orgadmin@${id}.com`,
          password: hashedPassword,
          name: `${org.name} OrgAdmin`,
        },
      });

      const editorUser = await tx.user.create({
        data: {
          email: `editor@${id}.com`,
          password: hashedPassword,
          name: `${org.name} Editor`,
        },
      });

      const viewerUser = await tx.user.create({
        data: {
          email: `viewer@${id}.com`,
          password: hashedPassword,
          name: `${org.name} Viewer`,
        },
      });

      // Create memberships for each role
      await tx.membership.createMany({
        data: [
          {
            organizationId: org.id,
            userId: orgAdminUser.id,
            role: 'OrgAdmin',
          },
          {
            organizationId: org.id,
            userId: editorUser.id,
            role: 'Editor',
          },
          {
            organizationId: org.id,
            userId: viewerUser.id,
            role: 'Viewer',
          },
        ],
      });

      return org;
    });

    await this.outbox.publish('organization.created', {
      id: organization.id,
      name: organization.name,
    });

    return organization;
  }

  private generateOrgId(name: string): string {
    // Convert name to lowercase, replace spaces with hyphens, remove special chars
    const baseId = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure it starts with 'org-'
    return baseId.startsWith('org-') ? baseId : `org-${baseId}`;
  }
}
