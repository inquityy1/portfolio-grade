import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from '../organizations.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockOutboxService: jest.Mocked<OutboxService>;

  beforeEach(async () => {
    const mockPrisma = {
      organization: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
      membership: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: mockOutbox },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    mockPrismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    mockOutboxService = module.get(OutboxService) as jest.Mocked<OutboxService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all organizations', async () => {
      const expectedOrganizations = [
        {
          id: 'org-company-a',
          name: 'Company A',
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'org-company-b',
          name: 'Company B',
          createdAt: new Date('2024-01-14T09:15:00Z'),
        },
      ];

      (mockPrismaService.organization.findMany as jest.Mock).mockResolvedValue(
        expectedOrganizations,
      );

      const result = await service.findAll();

      expect(mockPrismaService.organization.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, createdAt: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expectedOrganizations);
    });

    it('should return empty array when no organizations exist', async () => {
      (mockPrismaService.organization.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      const orgId = 'org-my-company';
      const expectedOrganization = {
        id: orgId,
        name: 'My Company',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      };

      (mockPrismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        expectedOrganization,
      );

      const result = await service.findOne(orgId);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: orgId },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual(expectedOrganization);
    });

    it('should throw NotFoundException when organization is not found', async () => {
      const orgId = 'non-existent-org';

      (mockPrismaService.organization.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(orgId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: orgId },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      });
    });
  });

  describe('create', () => {
    it('should create organization successfully', async () => {
      const orgName = 'My New Company';
      const expectedOrg = {
        id: 'org-my-new-company',
        name: 'My New Company',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      // Mock the organization lookup to return null (no existing org)
      (mockPrismaService.organization.findFirst as jest.Mock).mockResolvedValue(null);

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          organization: { create: jest.fn().mockResolvedValue(expectedOrg) },
          user: { create: jest.fn().mockResolvedValue({ id: 'user-123' }) },
          membership: { createMany: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.create(orgName);

      expect(mockPrismaService.organization.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: orgName, mode: 'insensitive' } },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedOrg);
      expect(mockOutboxService.publish).toHaveBeenCalledWith('organization.created', {
        id: expectedOrg.id,
        name: expectedOrg.name,
      });
    });

    it('should throw ConflictException when organization name already exists', async () => {
      const orgName = 'Existing Company';
      const existingOrg = {
        id: 'org-existing-company',
        name: 'Existing Company',
      };

      (mockPrismaService.organization.findFirst as jest.Mock).mockResolvedValue(existingOrg);

      await expect(service.create(orgName)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.organization.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: orgName, mode: 'insensitive' } },
      });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should create system users and memberships', async () => {
      const orgName = 'Test Company';
      const expectedOrg = {
        id: 'org-test-company',
        name: 'Test Company',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      (mockPrismaService.organization.findFirst as jest.Mock).mockResolvedValue(null);

      const mockOrgCreate = jest.fn().mockResolvedValue(expectedOrg);
      const mockUserCreate = jest.fn().mockResolvedValue({ id: 'user-123' });
      const mockMembershipCreateMany = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          organization: { create: mockOrgCreate },
          user: { create: mockUserCreate },
          membership: { createMany: mockMembershipCreateMany },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.create(orgName);

      // Verify organization creation
      expect(mockOrgCreate).toHaveBeenCalledWith({
        data: {
          id: 'org-test-company',
          name: 'Test Company',
        },
        select: { id: true, name: true, createdAt: true },
      });

      // Verify user creation (should be called 3 times for each role)
      expect(mockUserCreate).toHaveBeenCalledTimes(3);

      // Verify membership creation
      expect(mockMembershipCreateMany).toHaveBeenCalledWith({
        data: [
          {
            organizationId: 'org-test-company',
            userId: 'user-123',
            role: 'OrgAdmin',
          },
          {
            organizationId: 'org-test-company',
            userId: 'user-123',
            role: 'Editor',
          },
          {
            organizationId: 'org-test-company',
            userId: 'user-123',
            role: 'Viewer',
          },
        ],
      });
    });

    it('should trim organization name', async () => {
      const orgName = '  Test Company  ';
      const expectedOrg = {
        id: 'org-test-company',
        name: 'Test Company',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      (mockPrismaService.organization.findFirst as jest.Mock).mockResolvedValue(null);

      const mockOrgCreate = jest.fn().mockResolvedValue(expectedOrg);

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          organization: { create: mockOrgCreate },
          user: { create: jest.fn().mockResolvedValue({ id: 'user-123' }) },
          membership: { createMany: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.create(orgName);

      expect(mockOrgCreate).toHaveBeenCalledWith({
        data: {
          id: 'org-test-company',
          name: 'Test Company', // Should be trimmed
        },
        select: { id: true, name: true, createdAt: true },
      });
    });
  });

  describe('generateOrgId', () => {
    it('should generate correct org ID from simple name', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('My Company');
      expect(result).toBe('org-my-company');
    });

    it('should generate correct org ID from complex name', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('My Company & Co. Ltd!');
      expect(result).toBe('org-my-company-co-ltd');
    });

    it('should handle names with multiple spaces', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('My   Company   Inc');
      expect(result).toBe('org-my-company-inc');
    });

    it('should handle names with multiple hyphens', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('My--Company---Inc');
      expect(result).toBe('org-my-company-inc');
    });

    it('should handle names starting with org-', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('org-my-company');
      expect(result).toBe('org-my-company');
    });

    it('should handle names with special characters', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('My@Company#123$%');
      expect(result).toBe('org-mycompany123');
    });

    it('should handle empty string', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('');
      expect(result).toBe('org-');
    });

    it('should handle whitespace-only string', () => {
      const service = new OrganizationsService(mockPrismaService, mockOutboxService);
      const result = (service as any).generateOrgId('   ');
      expect(result).toBe('org-');
    });
  });
});
