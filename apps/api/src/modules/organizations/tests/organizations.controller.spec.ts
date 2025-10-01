import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from '../organizations.controller';
import { OrganizationsService } from '../organizations.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { RateLimitService } from '../../../infra/services/rate-limit.service';
import { OrgAdminOnlyGuard } from '../../../common/guards/org-admin-only.guard';

describe('OrganizationsController', () => {
    let controller: OrganizationsController;
    let service: OrganizationsService;

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
            controllers: [OrganizationsController],
            providers: [
                OrganizationsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: OutboxService, useValue: mockOutbox },
                { provide: RateLimitService, useValue: { hit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }) } },
                { provide: OrgAdminOnlyGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
            ],
        }).compile();

        controller = module.get<OrganizationsController>(OrganizationsController);
        service = module.get<OrganizationsService>(OrganizationsService);
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

            jest.spyOn(service, 'findAll').mockResolvedValue(expectedOrganizations);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(expectedOrganizations);
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

            jest.spyOn(service, 'findOne').mockResolvedValue(expectedOrganization);

            const result = await controller.findOne(orgId);

            expect(service.findOne).toHaveBeenCalledWith(orgId);
            expect(result).toEqual(expectedOrganization);
        });
    });

    describe('create', () => {
        it('should create a new organization', async () => {
            const dto = { name: 'My New Company' };
            const expectedOrganization = {
                id: 'org-my-new-company',
                name: 'My New Company',
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(service, 'create').mockResolvedValue(expectedOrganization);

            const result = await controller.create(dto);

            expect(service.create).toHaveBeenCalledWith(dto.name);
            expect(result).toEqual(expectedOrganization);
        });
    });

    describe('Controller Metadata', () => {
        it('should have controller methods defined', () => {
            expect(typeof controller.findAll).toBe('function');
            expect(typeof controller.findOne).toBe('function');
            expect(typeof controller.create).toBe('function');
        });
    });
});
