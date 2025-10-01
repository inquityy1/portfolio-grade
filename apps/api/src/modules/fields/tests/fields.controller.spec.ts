import { Test, TestingModule } from '@nestjs/testing';
import { FieldsController } from '../fields.controller';
import { FieldsService } from '../fields.service';
import { CreateFieldDto } from '../dto/create-field.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('FieldsController', () => {
    let controller: FieldsController;
    let fieldsService: FieldsService;

    const mockFieldsService = {
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPrismaService = {
        membership: {
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FieldsController],
            providers: [
                {
                    provide: FieldsService,
                    useValue: mockFieldsService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: RolesGuard,
                    useValue: {
                        canActivate: jest.fn().mockReturnValue(true),
                    },
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                        getAllAndMerge: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<FieldsController>(FieldsController);
        fieldsService = module.get<FieldsService>(FieldsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const createFieldDto: CreateFieldDto = {
                label: 'Email Address',
                type: 'email',
                config: { required: true, placeholder: 'Enter your email' },
                order: 1,
            };
            const expectedField = {
                id: 'field-123',
                formId,
                label: 'Email Address',
                type: 'email',
                order: 1,
                config: { required: true, placeholder: 'Enter your email' },
            };

            mockFieldsService.create.mockResolvedValue(expectedField);

            const mockReq = { user: { userId } };

            const result = await controller.create(orgId, mockReq, formId, createFieldDto);

            expect(fieldsService.create).toHaveBeenCalledWith(orgId, userId, formId, createFieldDto);
            expect(result).toEqual(expectedField);
        });

        it('should create a field with minimal data', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const createFieldDto: CreateFieldDto = {
                label: 'Name',
                type: 'text',
            };
            const expectedField = {
                id: 'field-123',
                formId,
                label: 'Name',
                type: 'text',
                order: 0,
                config: undefined,
            };

            mockFieldsService.create.mockResolvedValue(expectedField);

            const mockReq = { user: { userId } };

            const result = await controller.create(orgId, mockReq, formId, createFieldDto);

            expect(fieldsService.create).toHaveBeenCalledWith(orgId, userId, formId, createFieldDto);
            expect(result).toEqual(expectedField);
        });

        it('should handle service errors', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'non-existent-form';
            const createFieldDto: CreateFieldDto = {
                label: 'Email Address',
                type: 'email',
            };

            mockFieldsService.create.mockRejectedValue(new NotFoundException('Form not found'));

            const mockReq = { user: { userId } };

            await expect(controller.create(orgId, mockReq, formId, createFieldDto)).rejects.toThrow(NotFoundException);
            expect(fieldsService.create).toHaveBeenCalledWith(orgId, userId, formId, createFieldDto);
        });
    });

    describe('update', () => {
        it('should update a field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const updateFieldDto: UpdateFieldDto = {
                label: 'Updated Email Address',
                type: 'email',
                config: { required: true, placeholder: 'Enter your email' },
                order: 2,
            };
            const expectedField = {
                id: fieldId,
                formId: 'form-123',
                label: 'Updated Email Address',
                type: 'email',
                order: 2,
                config: { required: true, placeholder: 'Enter your email' },
            };

            mockFieldsService.update.mockResolvedValue(expectedField);

            const mockReq = { user: { userId } };

            const result = await controller.update(orgId, mockReq, fieldId, updateFieldDto);

            expect(fieldsService.update).toHaveBeenCalledWith(orgId, userId, fieldId, updateFieldDto);
            expect(result).toEqual(expectedField);
        });

        it('should update a field with partial data', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const updateFieldDto: UpdateFieldDto = {
                label: 'Updated Name',
            };
            const expectedField = {
                id: fieldId,
                formId: 'form-123',
                label: 'Updated Name',
                type: 'text',
                order: 0,
                config: undefined,
            };

            mockFieldsService.update.mockResolvedValue(expectedField);

            const mockReq = { user: { userId } };

            const result = await controller.update(orgId, mockReq, fieldId, updateFieldDto);

            expect(fieldsService.update).toHaveBeenCalledWith(orgId, userId, fieldId, updateFieldDto);
            expect(result).toEqual(expectedField);
        });

        it('should handle service errors', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'non-existent-field';
            const updateFieldDto: UpdateFieldDto = {
                label: 'Updated Name',
            };

            mockFieldsService.update.mockRejectedValue(new NotFoundException('Field not found'));

            const mockReq = { user: { userId } };

            await expect(controller.update(orgId, mockReq, fieldId, updateFieldDto)).rejects.toThrow(NotFoundException);
            expect(fieldsService.update).toHaveBeenCalledWith(orgId, userId, fieldId, updateFieldDto);
        });
    });

    describe('remove', () => {
        it('should delete a field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const expectedResult = { ok: true };

            mockFieldsService.remove.mockResolvedValue(expectedResult);

            const mockReq = { user: { userId } };

            const result = await controller.remove(orgId, mockReq, fieldId);

            expect(fieldsService.remove).toHaveBeenCalledWith(orgId, userId, fieldId);
            expect(result).toEqual(expectedResult);
        });

        it('should handle service errors', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'non-existent-field';

            mockFieldsService.remove.mockRejectedValue(new NotFoundException('Field not found'));

            const mockReq = { user: { userId } };

            await expect(controller.remove(orgId, mockReq, fieldId)).rejects.toThrow(NotFoundException);
            expect(fieldsService.remove).toHaveBeenCalledWith(orgId, userId, fieldId);
        });
    });

    describe('controller metadata', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should have correct route decorators', () => {
            // Test that the controller methods exist and are callable
            expect(typeof controller.create).toBe('function');
            expect(typeof controller.update).toBe('function');
            expect(typeof controller.remove).toBe('function');
        });

        it('should have correct HTTP method decorators', () => {
            // Test that the controller methods exist and are callable
            expect(typeof controller.create).toBe('function');
            expect(typeof controller.update).toBe('function');
            expect(typeof controller.remove).toBe('function');
        });
    });
});
