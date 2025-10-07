import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsService } from '../submissions.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      form: {
        findFirst: jest.fn(),
      },
      submission: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmissionsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
    mockPrismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubmission', () => {
    const orgId = 'org-123';
    const formId = 'form-123';
    const submissionData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test submission!',
    };

    const expectedSubmission = {
      id: 'submission-123',
      formId,
      data: submissionData,
      createdAt: new Date('2024-01-15T10:30:00Z'),
    };

    beforeEach(() => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });
      (mockPrismaService.submission.create as jest.Mock).mockResolvedValue(expectedSubmission);
    });

    it('should create a submission successfully', async () => {
      const result = await service.createSubmission(orgId, formId, submissionData);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.submission.create).toHaveBeenCalledWith({
        data: { formId, data: submissionData },
        select: { id: true, formId: true, data: true, createdAt: true },
      });
      expect(result).toEqual(expectedSubmission);
    });

    it('should create a submission with complex data', async () => {
      const complexData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        preferences: {
          newsletter: true,
          notifications: false,
        },
        metadata: {
          source: 'website',
          timestamp: new Date('2024-01-15T10:30:00Z'),
        },
      };

      const result = await service.createSubmission(orgId, formId, complexData);

      expect(mockPrismaService.submission.create).toHaveBeenCalledWith({
        data: { formId, data: complexData },
        select: { id: true, formId: true, data: true, createdAt: true },
      });
      expect(result).toEqual(expectedSubmission);
    });

    it('should create a submission with empty data', async () => {
      const emptyData = {};

      const result = await service.createSubmission(orgId, formId, emptyData);

      expect(mockPrismaService.submission.create).toHaveBeenCalledWith({
        data: { formId, data: emptyData },
        select: { id: true, formId: true, data: true, createdAt: true },
      });
      expect(result).toEqual(expectedSubmission);
    });

    it('should throw NotFoundException when form not found', async () => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.createSubmission(orgId, formId, submissionData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createSubmission(orgId, formId, submissionData)).rejects.toThrow(
        'Form not found',
      );

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.submission.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when form belongs to different organization', async () => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.createSubmission(orgId, formId, submissionData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createSubmission(orgId, formId, submissionData)).rejects.toThrow(
        'Form not found',
      );
    });
  });

  describe('listSubmissions', () => {
    const orgId = 'org-123';
    const formId = 'form-123';
    const expectedSubmissions = [
      {
        id: 'submission-1',
        data: { name: 'John Doe', email: 'john@example.com' },
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: 'submission-2',
        data: { name: 'Jane Smith', email: 'jane@example.com' },
        createdAt: new Date('2024-01-14T09:15:00Z'),
      },
    ];

    beforeEach(() => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });
      (mockPrismaService.submission.findMany as jest.Mock).mockResolvedValue(expectedSubmissions);
    });

    it('should list submissions successfully', async () => {
      const result = await service.listSubmissions(orgId, formId);

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, data: true, createdAt: true },
      });
      expect(result).toEqual(expectedSubmissions);
    });

    it('should return empty array when no submissions exist', async () => {
      (mockPrismaService.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listSubmissions(orgId, formId);

      expect(result).toEqual([]);
      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, data: true, createdAt: true },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listSubmissions(orgId, formId)).rejects.toThrow(NotFoundException);
      await expect(service.listSubmissions(orgId, formId)).rejects.toThrow('Form not found');

      expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
        where: { id: formId, organizationId: orgId },
        select: { id: true },
      });
      expect(mockPrismaService.submission.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when form belongs to different organization', async () => {
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listSubmissions(orgId, formId)).rejects.toThrow(NotFoundException);
      await expect(service.listSubmissions(orgId, formId)).rejects.toThrow('Form not found');
    });
  });

  describe('getSubmission', () => {
    const orgId = 'org-123';
    const submissionId = 'submission-123';
    const expectedSubmission = {
      id: submissionId,
      formId: 'form-123',
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test submission!',
      },
      createdAt: new Date('2024-01-15T10:30:00Z'),
    };

    beforeEach(() => {
      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(expectedSubmission);
    });

    it('should get a submission successfully', async () => {
      const result = await service.getSubmission(orgId, submissionId);

      expect(mockPrismaService.submission.findFirst).toHaveBeenCalledWith({
        where: { id: submissionId, form: { organizationId: orgId } },
        select: { id: true, formId: true, data: true, createdAt: true },
      });
      expect(result).toEqual(expectedSubmission);
    });

    it('should get a submission with complex data', async () => {
      const complexSubmission = {
        id: submissionId,
        formId: 'form-123',
        data: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          preferences: {
            newsletter: true,
            notifications: false,
          },
          metadata: {
            source: 'website',
            timestamp: new Date('2024-01-15T10:30:00Z'),
          },
        },
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(complexSubmission);

      const result = await service.getSubmission(orgId, submissionId);

      expect(result).toEqual(complexSubmission);
    });

    it('should throw NotFoundException when submission not found', async () => {
      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getSubmission(orgId, submissionId)).rejects.toThrow(NotFoundException);
      await expect(service.getSubmission(orgId, submissionId)).rejects.toThrow(
        'Submission not found',
      );

      expect(mockPrismaService.submission.findFirst).toHaveBeenCalledWith({
        where: { id: submissionId, form: { organizationId: orgId } },
        select: { id: true, formId: true, data: true, createdAt: true },
      });
    });

    it('should throw NotFoundException when submission belongs to different organization', async () => {
      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getSubmission(orgId, submissionId)).rejects.toThrow(NotFoundException);
      await expect(service.getSubmission(orgId, submissionId)).rejects.toThrow(
        'Submission not found',
      );
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getSubmission(orgId, 'non-existent-submission')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getSubmission(orgId, 'non-existent-submission')).rejects.toThrow(
        'Submission not found',
      );
    });
  });

  describe('Service Integration', () => {
    const orgId = 'org-123';
    const formId = 'form-123';
    const submissionId = 'submission-123';

    it('should handle complete submission workflow', async () => {
      const submissionData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test submission!',
      };

      const createdSubmission = {
        id: submissionId,
        formId,
        data: submissionData,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const listedSubmission = {
        id: submissionId,
        data: submissionData,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const retrievedSubmission = {
        id: submissionId,
        formId,
        data: submissionData,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      // Setup mocks
      (mockPrismaService.form.findFirst as jest.Mock).mockResolvedValue({ id: formId });
      (mockPrismaService.submission.create as jest.Mock).mockResolvedValue(createdSubmission);
      (mockPrismaService.submission.findMany as jest.Mock).mockResolvedValue([listedSubmission]);
      (mockPrismaService.submission.findFirst as jest.Mock).mockResolvedValue(retrievedSubmission);

      // Test create
      const createResult = await service.createSubmission(orgId, formId, submissionData);
      expect(createResult).toEqual(createdSubmission);

      // Test list
      const listResult = await service.listSubmissions(orgId, formId);
      expect(listResult).toEqual([listedSubmission]);

      // Test get
      const getResult = await service.getSubmission(orgId, submissionId);
      expect(getResult).toEqual(retrievedSubmission);

      // Verify all methods were called
      expect(mockPrismaService.form.findFirst).toHaveBeenCalledTimes(2); // create + list
      expect(mockPrismaService.submission.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.submission.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.submission.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});
