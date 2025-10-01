import { Test, TestingModule } from '@nestjs/testing';
import { FieldsService } from '../fields.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { NotFoundException } from '@nestjs/common';

describe('FieldsService', () => {
    let service: FieldsService;
    let prismaService: PrismaService;
    let outboxService: OutboxService;

    const mockPrismaService = {
        form: {
            findFirst: jest.fn(),
        },
        field: {
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

    const mockOutboxService = {
        publish: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FieldsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: OutboxService,
                    useValue: mockOutboxService,
                },
            ],
        }).compile();

        service = module.get<FieldsService>(FieldsService);
        prismaService = module.get<PrismaService>(PrismaService);
        outboxService = module.get<OutboxService>(OutboxService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const dto = {
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

            // Mock the form lookup before transaction
            mockPrismaService.form.findFirst.mockResolvedValue({ id: formId });

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: { create: jest.fn().mockResolvedValue(expectedField) },
                    auditLog: { create: jest.fn().mockResolvedValue({}) },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            const result = await service.create(orgId, userId, formId, dto);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { id: formId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result).toEqual(expectedField);
            expect(mockOutboxService.publish).toHaveBeenCalledWith('field.created', {
                id: expectedField.id,
                orgId,
            });
        });

        it('should create a field with minimal data', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const dto = {
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

            // Mock the form lookup before transaction
            mockPrismaService.form.findFirst.mockResolvedValue({ id: formId });

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: { create: jest.fn().mockResolvedValue(expectedField) },
                    auditLog: { create: jest.fn().mockResolvedValue({}) },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            const result = await service.create(orgId, userId, formId, dto);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { id: formId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result).toEqual(expectedField);
        });

        it('should trim label and type', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const dto = {
                label: '  Email Address  ',
                type: '  email  ',
                config: { required: true },
                order: 1,
            };

            // Mock the form lookup before transaction
            mockPrismaService.form.findFirst.mockResolvedValue({ id: formId });

            const mockFieldCreate = jest.fn().mockResolvedValue({});
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: { create: mockFieldCreate },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.create(orgId, userId, formId, dto);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { id: formId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockTransaction).toHaveBeenCalled();
            expect(mockFieldCreate).toHaveBeenCalledWith({
                data: {
                    formId,
                    label: 'Email Address',
                    type: 'email',
                    config: { required: true },
                    order: 1,
                },
                select: { id: true, formId: true, label: true, type: true, order: true, config: true },
            });
        });

        it('should throw NotFoundException when form is not found', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'non-existent-form';
            const dto = {
                label: 'Email Address',
                type: 'email',
            };

            // Mock the form lookup to return null (form not found)
            mockPrismaService.form.findFirst.mockResolvedValue(null);

            await expect(service.create(orgId, userId, formId, dto)).rejects.toThrow(NotFoundException);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { id: formId, organizationId: orgId },
                select: { id: true },
            });
            // Transaction should not be called when form is not found
            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });

        it('should create audit log', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const dto = {
                label: 'Email Address',
                type: 'email',
            };

            // Mock the form lookup before transaction
            mockPrismaService.form.findFirst.mockResolvedValue({ id: formId });

            const mockFieldCreate = jest.fn().mockResolvedValue({ id: 'field-123' });
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: { create: mockFieldCreate },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.create(orgId, userId, formId, dto);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { id: formId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockAuditLogCreate).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_CREATED',
                    resource: 'Field',
                    resourceId: 'field-123',
                },
            });
        });
    });

    describe('update', () => {
        it('should update a field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const dto = {
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

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        update: jest.fn().mockResolvedValue(expectedField),
                    },
                    auditLog: { create: jest.fn().mockResolvedValue({}) },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            const result = await service.update(orgId, userId, fieldId, dto);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result).toEqual(expectedField);
            expect(mockOutboxService.publish).toHaveBeenCalledWith('field.updated', {
                id: fieldId,
                orgId,
            });
        });

        it('should update field with partial data', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const dto = {
                label: 'Updated Name',
            };

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockFieldUpdate = jest.fn().mockResolvedValue({});
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        update: mockFieldUpdate,
                    },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.update(orgId, userId, fieldId, dto);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockFieldUpdate).toHaveBeenCalledWith({
                where: { id: fieldId },
                data: {
                    label: 'Updated Name',
                    type: undefined,
                    config: undefined,
                    order: undefined,
                },
                select: { id: true, formId: true, label: true, type: true, order: true, config: true },
            });
        });

        it('should trim label and type when provided', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const dto = {
                label: '  Updated Name  ',
                type: '  text  ',
            };

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockFieldUpdate = jest.fn().mockResolvedValue({});
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        update: mockFieldUpdate,
                    },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.update(orgId, userId, fieldId, dto);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockFieldUpdate).toHaveBeenCalledWith({
                where: { id: fieldId },
                data: {
                    label: 'Updated Name',
                    type: 'text',
                    config: undefined,
                    order: undefined,
                },
                select: { id: true, formId: true, label: true, type: true, order: true, config: true },
            });
        });

        it('should throw NotFoundException when field is not found', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'non-existent-field';
            const dto = {
                label: 'Updated Name',
            };

            // Mock the field lookup to return null (field not found)
            mockPrismaService.field.findFirst.mockResolvedValue(null);

            await expect(service.update(orgId, userId, fieldId, dto)).rejects.toThrow(NotFoundException);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            // Transaction should not be called when field is not found
            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });

        it('should create audit log', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';
            const dto = {
                label: 'Updated Name',
            };

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockFieldUpdate = jest.fn().mockResolvedValue({});
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        update: mockFieldUpdate,
                    },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.update(orgId, userId, fieldId, dto);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockAuditLogCreate).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_UPDATED',
                    resource: 'Field',
                    resourceId: fieldId,
                },
            });
        });
    });

    describe('remove', () => {
        it('should delete a field', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        delete: jest.fn().mockResolvedValue({}),
                    },
                    auditLog: { create: jest.fn().mockResolvedValue({}) },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            const result = await service.remove(orgId, userId, fieldId);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockPrismaService.$transaction).toHaveBeenCalled();
            expect(result).toEqual({ ok: true });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('field.deleted', {
                id: fieldId,
                orgId,
            });
        });

        it('should throw NotFoundException when field is not found', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'non-existent-field';

            // Mock the field lookup to return null (field not found)
            mockPrismaService.field.findFirst.mockResolvedValue(null);

            await expect(service.remove(orgId, userId, fieldId)).rejects.toThrow(NotFoundException);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            // Transaction should not be called when field is not found
            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });

        it('should create audit log', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const fieldId = 'field-123';

            // Mock the field lookup before transaction
            mockPrismaService.field.findFirst.mockResolvedValue({ id: fieldId });

            const mockFieldDelete = jest.fn().mockResolvedValue({});
            const mockAuditLogCreate = jest.fn().mockResolvedValue({});

            const mockTransaction = jest.fn().mockImplementation(async (callback) => {
                const tx = {
                    field: {
                        delete: mockFieldDelete,
                    },
                    auditLog: { create: mockAuditLogCreate },
                };
                return await callback(tx);
            });

            mockPrismaService.$transaction.mockImplementation(mockTransaction);

            await service.remove(orgId, userId, fieldId);

            expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
                where: { id: fieldId, form: { organizationId: orgId } },
                select: { id: true },
            });
            expect(mockAuditLogCreate).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'FIELD_DELETED',
                    resource: 'Field',
                    resourceId: fieldId,
                },
            });
        });
    });
});
