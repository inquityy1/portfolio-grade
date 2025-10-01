import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from '../forms.controller';
import { FormsService } from '../forms.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RateLimitService } from '../../../infra/services/rate-limit.service';
import { Reflector } from '@nestjs/core';

describe('FormsController', () => {
    let controller: FormsController;
    let service: FormsService;

    beforeEach(async () => {
        const mockPrisma = {
            form: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            auditLog: {
                create: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        const mockOutbox = {
            publish: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FormsController],
            providers: [
                FormsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: OutboxService, useValue: mockOutbox },
                { provide: RolesGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: RateLimitService, useValue: { hit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }) } },
            ],
        }).compile();

        controller = module.get<FormsController>(FormsController);
        service = module.get<FormsService>(FormsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should return forms list', async () => {
            const orgId = 'org-123';
            const expectedForms = [
                {
                    id: 'form-1',
                    name: 'Contact Form',
                    schema: { title: 'Contact Us', fields: [] },
                    updatedAt: new Date('2024-01-15T10:30:00Z'),
                },
            ];

            jest.spyOn(service, 'list').mockResolvedValue(expectedForms);

            const result = await controller.list(orgId);

            expect(service.list).toHaveBeenCalledWith(orgId);
            expect(result).toEqual(expectedForms);
        });
    });

    describe('get', () => {
        it('should return a specific form', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const expectedForm = {
                id: formId,
                name: 'Contact Form',
                organizationId: orgId,
                schema: { title: 'Contact Us', fields: [] },
                createdAt: new Date('2024-01-15T10:30:00Z'),
                updatedAt: new Date('2024-01-15T10:30:00Z'),
                fields: [],
            };

            jest.spyOn(service, 'get').mockResolvedValue(expectedForm);

            const result = await controller.get(orgId, formId);

            expect(service.get).toHaveBeenCalledWith(orgId, formId);
            expect(result).toEqual(expectedForm);
        });
    });

    describe('create', () => {
        it('should create a new form', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const dto = {
                name: 'Contact Form',
                schema: { title: 'Contact Us', fields: [] },
            };
            const expectedForm = {
                id: 'form-123',
                name: 'Contact Form',
                schema: { title: 'Contact Us', fields: [] },
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            const mockRequest = { user: { userId } };

            jest.spyOn(service, 'create').mockResolvedValue(expectedForm);

            const result = await controller.create(orgId, mockRequest, dto);

            expect(service.create).toHaveBeenCalledWith(orgId, userId, dto);
            expect(result).toEqual(expectedForm);
        });
    });

    describe('update', () => {
        it('should update an existing form', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const dto = {
                name: 'Updated Contact Form',
                schema: { title: 'Updated Contact Us', fields: [] },
            };
            const expectedForm = {
                id: formId,
                name: 'Updated Contact Form',
                schema: { title: 'Updated Contact Us', fields: [] },
                updatedAt: new Date('2024-01-15T11:30:00Z'),
            };

            const mockRequest = { user: { userId } };

            jest.spyOn(service, 'update').mockResolvedValue(expectedForm);

            const result = await controller.update(orgId, mockRequest, formId, dto);

            expect(service.update).toHaveBeenCalledWith(orgId, userId, formId, dto);
            expect(result).toEqual(expectedForm);
        });
    });

    describe('remove', () => {
        it('should delete a form', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const expectedResult = { ok: true };

            const mockRequest = { user: { userId } };

            jest.spyOn(service, 'remove').mockResolvedValue(expectedResult);

            const result = await controller.remove(orgId, mockRequest, formId);

            expect(service.remove).toHaveBeenCalledWith(orgId, userId, formId);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('Controller Metadata', () => {
        it('should have controller methods defined', () => {
            expect(typeof controller.list).toBe('function');
            expect(typeof controller.get).toBe('function');
            expect(typeof controller.create).toBe('function');
            expect(typeof controller.update).toBe('function');
            expect(typeof controller.remove).toBe('function');
        });
    });
});
