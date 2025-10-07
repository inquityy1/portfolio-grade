import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from '../forms.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockOutboxService: jest.Mocked<OutboxService>;

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
      providers: [
        FormsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: mockOutbox },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    mockPrismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    mockOutboxService = module.get(OutboxService) as jest.Mocked<OutboxService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return forms for organization', async () => {
      const orgId = 'org-123';
      const expectedForms = [
        {
          id: 'form-1',
          name: 'Contact Form',
          schema: { title: 'Contact Us', fields: [] },
          updatedAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'form-2',
          name: 'Survey Form',
          schema: { title: 'Customer Survey', fields: [] },
          updatedAt: new Date('2024-01-14T09:15:00Z'),
        },
      ];

      (mockPrismaService.form.findMany as jest.Mock).mockResolvedValue(expectedForms);

      const result = await service.list(orgId);

      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, schema: true, updatedAt: true },
      });
      expect(result).toEqual(expectedForms);
    });

    it('should return empty array when no forms exist', async () => {
      const orgId = 'org-123';
      (mockPrismaService.form.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.list(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return form with fields', async () => {
      const orgId = 'org-123';
      const formId = 'form-123';
      const expectedForm = {
        id: formId,
        name: 'Contact Form',
        organizationId: orgId,
        schema: { title: 'Contact Us', fields: [] },
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z'),
        fields: [
          {
            id: 'field-1',
            formId: formId,
            label: 'Name',
            type: 'text',
            order: 0,
            config: { required: true },
          },
        ],
      };

      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(expectedForm);

      const result = await service.get(orgId, formId);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        include: { fields: { orderBy: { order: 'asc' } } },
      });
      expect(result).toEqual(expectedForm);
    });

    it('should throw NotFoundException when form is not found', async () => {
      const orgId = 'org-123';
      const formId = 'non-existent-form';

      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.get(orgId, formId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        include: { fields: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('create', () => {
    it('should create a form successfully', async () => {
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

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { create: jest.fn().mockResolvedValue(expectedForm) },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.create(orgId, userId, dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedForm);
      expect(mockOutboxService.publish).toHaveBeenCalledWith('form.created', {
        id: expectedForm.id,
        orgId,
      });
    });

    it('should throw ForbiddenException when schema is not an object', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const dto = {
        name: 'Contact Form',
        schema: 'invalid schema' as any,
      };

      await expect(service.create(orgId, userId, dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when schema is null', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const dto = {
        name: 'Contact Form',
        schema: null as any,
      };

      await expect(service.create(orgId, userId, dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should create audit log', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const dto = {
        name: 'Contact Form',
        schema: { title: 'Contact Us', fields: [] },
      };

      const mockFormCreate = jest.fn().mockResolvedValue({ id: 'form-123' });
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { create: mockFormCreate },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.create(orgId, userId, dto);

      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          userId,
          action: 'FORM_CREATED',
          resource: 'Form',
          resourceId: 'form-123',
        },
      });
    });

    it('should handle Prisma unique constraint error', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const dto = {
        name: 'Contact Form',
        schema: { title: 'Contact Us', fields: [] },
      };

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { create: jest.fn().mockRejectedValue({ code: 'P2002' }) },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.create(orgId, userId, dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a form successfully', async () => {
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

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      const mockFormUpdate = jest.fn().mockResolvedValue(expectedForm);
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { update: mockFormUpdate },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.update(orgId, userId, formId, dto);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(expectedForm);
      expect(mockOutboxService.publish).toHaveBeenCalledWith('form.updated', {
        id: formId,
        orgId,
      });
    });

    it('should update form with partial data', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'form-123';
      const dto = {
        name: 'Updated Contact Form',
      };

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      const mockFormUpdate = jest.fn().mockResolvedValue({});
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { update: mockFormUpdate },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.update(orgId, userId, formId, dto);

      expect(mockFormUpdate).toHaveBeenCalledWith({
        where: { id: formId },
        data: { name: 'Updated Contact Form', schema: undefined },
        select: { id: true, name: true, schema: true, updatedAt: true },
      });
    });

    it('should throw NotFoundException when form is not found', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'non-existent-form';
      const dto = {
        name: 'Updated Contact Form',
      };

      // Mock the form lookup to return null (form not found)
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(orgId, userId, formId, dto)).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      // Transaction should not be called when form is not found
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when schema is not an object', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'form-123';
      const dto = {
        name: 'Updated Contact Form',
        schema: 'invalid schema' as any,
      };

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      await expect(service.update(orgId, userId, formId, dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should create audit log', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'form-123';
      const dto = {
        name: 'Updated Contact Form',
      };

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      const mockFormUpdate = jest.fn().mockResolvedValue({});
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { update: mockFormUpdate },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.update(orgId, userId, formId, dto);

      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          userId,
          action: 'FORM_UPDATED',
          resource: 'Form',
          resourceId: formId,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a form successfully', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'form-123';

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      const mockFormDelete = jest.fn().mockResolvedValue({});
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { delete: mockFormDelete },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.remove(orgId, userId, formId);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
      expect(mockOutboxService.publish).toHaveBeenCalledWith('form.deleted', {
        id: formId,
        orgId,
      });
    });

    it('should throw NotFoundException when form is not found', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const formId = 'non-existent-form';

      // Mock the form lookup to return null (form not found)
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(orgId, userId, formId)).rejects.toThrow(NotFoundException);

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

      // Mock the form lookup before transaction
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });

      const mockFormDelete = jest.fn().mockResolvedValue({});
      const mockAuditLogCreate = jest.fn().mockResolvedValue({});

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          form: { delete: mockFormDelete },
          auditLog: { create: mockAuditLogCreate },
        };
        return await callback(tx);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await service.remove(orgId, userId, formId);

      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          userId,
          action: 'FORM_DELETED',
          resource: 'Form',
          resourceId: formId,
        },
      });
    });
  });
});
