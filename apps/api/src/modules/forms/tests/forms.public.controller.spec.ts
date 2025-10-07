import { Test, TestingModule } from '@nestjs/testing';
import { FormsPublicController } from '../forms.public.controller';
import { FormsService } from '../forms.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('FormsPublicController', () => {
  let controller: FormsPublicController;
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
      controllers: [FormsPublicController],
      providers: [
        FormsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: mockOutbox },
        {
          provide: RateLimitService,
          useValue: {
            hit: jest
              .fn()
              .mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }),
          },
        },
      ],
    }).compile();

    controller = module.get<FormsPublicController>(FormsPublicController);
    service = module.get<FormsService>(FormsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublic', () => {
    it('should return public form data', async () => {
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

      jest.spyOn(service, 'get').mockResolvedValue(expectedForm);

      const result = await controller.getPublic(orgId, formId);

      expect(service.get).toHaveBeenCalledWith(orgId, formId);
      expect(result).toEqual(expectedForm);
    });

    it('should handle service errors', async () => {
      const orgId = 'org-123';
      const formId = 'non-existent-form';

      jest.spyOn(service, 'get').mockRejectedValue(new Error('Form not found'));

      await expect(controller.getPublic(orgId, formId)).rejects.toThrow('Form not found');
      expect(service.get).toHaveBeenCalledWith(orgId, formId);
    });
  });

  describe('Controller Metadata', () => {
    it('should have controller methods defined', () => {
      expect(typeof controller.getPublic).toBe('function');
    });
  });
});
