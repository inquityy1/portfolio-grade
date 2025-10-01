import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from '../submissions.controller';
import { SubmissionsService } from '../submissions.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('SubmissionsController', () => {
    let controller: SubmissionsController;
    let mockSubmissionsService: jest.Mocked<SubmissionsService>;

    const mockPrisma = {
        form: { findFirst: jest.fn() },
        submission: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubmissionsController],
            providers: [
                SubmissionsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RolesGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: RateLimitService, useValue: { hit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }) } },
            ],
        }).compile();

        controller = module.get<SubmissionsController>(SubmissionsController);
        mockSubmissionsService = module.get(SubmissionsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('submitPublic', () => {
        it('should submit form data publicly', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const submissionData = {
                name: 'John Doe',
                email: 'john@example.com',
                message: 'Hello, this is a test submission!',
            };

            const createDto = {
                data: submissionData,
            };

            const expectedSubmission = {
                id: 'submission-123',
                formId,
                data: submissionData,
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockSubmissionsService, 'createSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.submitPublic(orgId, formId, createDto);

            expect(mockSubmissionsService.createSubmission).toHaveBeenCalledWith(orgId, formId, submissionData);
            expect(result).toEqual(expectedSubmission);
        });

        it('should submit form data with complex structure', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const complexData = {
                personalInfo: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com'
                },
                preferences: {
                    newsletter: true,
                    notifications: false
                },
                metadata: {
                    source: 'website',
                    timestamp: '2024-01-15T10:30:00Z'
                }
            };

            const createDto = {
                data: complexData,
            };

            const expectedSubmission = {
                id: 'submission-123',
                formId,
                data: complexData,
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockSubmissionsService, 'createSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.submitPublic(orgId, formId, createDto);

            expect(mockSubmissionsService.createSubmission).toHaveBeenCalledWith(orgId, formId, complexData);
            expect(result).toEqual(expectedSubmission);
        });

        it('should submit form data with empty data object', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const emptyData = {};

            const createDto = {
                data: emptyData,
            };

            const expectedSubmission = {
                id: 'submission-123',
                formId,
                data: emptyData,
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockSubmissionsService, 'createSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.submitPublic(orgId, formId, createDto);

            expect(mockSubmissionsService.createSubmission).toHaveBeenCalledWith(orgId, formId, emptyData);
            expect(result).toEqual(expectedSubmission);
        });
    });

    describe('listAdmin', () => {
        it('should list submissions for admin', async () => {
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

            jest.spyOn(mockSubmissionsService, 'listSubmissions').mockResolvedValue(expectedSubmissions);

            const result = await controller.listAdmin(orgId, formId);

            expect(mockSubmissionsService.listSubmissions).toHaveBeenCalledWith(orgId, formId);
            expect(result).toEqual(expectedSubmissions);
        });

        it('should return empty array when no submissions exist', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const expectedSubmissions: any[] = [];

            jest.spyOn(mockSubmissionsService, 'listSubmissions').mockResolvedValue(expectedSubmissions);

            const result = await controller.listAdmin(orgId, formId);

            expect(mockSubmissionsService.listSubmissions).toHaveBeenCalledWith(orgId, formId);
            expect(result).toEqual([]);
        });

        it('should list submissions with complex data structures', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const expectedSubmissions = [
                {
                    id: 'submission-1',
                    data: {
                        personalInfo: {
                            firstName: 'John',
                            lastName: 'Doe',
                            email: 'john@example.com'
                        },
                        preferences: {
                            newsletter: true,
                            notifications: false
                        }
                    },
                    createdAt: new Date('2024-01-15T10:30:00Z'),
                },
            ];

            jest.spyOn(mockSubmissionsService, 'listSubmissions').mockResolvedValue(expectedSubmissions);

            const result = await controller.listAdmin(orgId, formId);

            expect(mockSubmissionsService.listSubmissions).toHaveBeenCalledWith(orgId, formId);
            expect(result).toEqual(expectedSubmissions);
        });
    });

    describe('getAdmin', () => {
        it('should get a specific submission for admin', async () => {
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

            jest.spyOn(mockSubmissionsService, 'getSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.getAdmin(orgId, submissionId);

            expect(mockSubmissionsService.getSubmission).toHaveBeenCalledWith(orgId, submissionId);
            expect(result).toEqual(expectedSubmission);
        });

        it('should get a submission with complex data structure', async () => {
            const orgId = 'org-123';
            const submissionId = 'submission-123';
            const expectedSubmission = {
                id: submissionId,
                formId: 'form-123',
                data: {
                    personalInfo: {
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@example.com'
                    },
                    preferences: {
                        newsletter: true,
                        notifications: false
                    },
                    metadata: {
                        source: 'website',
                        timestamp: '2024-01-15T10:30:00Z'
                    }
                },
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockSubmissionsService, 'getSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.getAdmin(orgId, submissionId);

            expect(mockSubmissionsService.getSubmission).toHaveBeenCalledWith(orgId, submissionId);
            expect(result).toEqual(expectedSubmission);
        });

        it('should get a submission with minimal data', async () => {
            const orgId = 'org-123';
            const submissionId = 'submission-123';
            const expectedSubmission = {
                id: submissionId,
                formId: 'form-123',
                data: {},
                createdAt: new Date('2024-01-15T10:30:00Z'),
            };

            jest.spyOn(mockSubmissionsService, 'getSubmission').mockResolvedValue(expectedSubmission);

            const result = await controller.getAdmin(orgId, submissionId);

            expect(mockSubmissionsService.getSubmission).toHaveBeenCalledWith(orgId, submissionId);
            expect(result).toEqual(expectedSubmission);
        });
    });

    describe('Controller Metadata', () => {
        it('should have controller methods defined', () => {
            expect(typeof controller.submitPublic).toBe('function');
            expect(typeof controller.listAdmin).toBe('function');
            expect(typeof controller.getAdmin).toBe('function');
        });
    });

    describe('Error Handling', () => {
        it('should propagate service errors for submitPublic', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';
            const createDto = {
                data: { name: 'John Doe' },
            };

            const error = new Error('Service error');
            jest.spyOn(mockSubmissionsService, 'createSubmission').mockRejectedValue(error);

            await expect(controller.submitPublic(orgId, formId, createDto)).rejects.toThrow('Service error');
        });

        it('should propagate service errors for listAdmin', async () => {
            const orgId = 'org-123';
            const formId = 'form-123';

            const error = new Error('Service error');
            jest.spyOn(mockSubmissionsService, 'listSubmissions').mockRejectedValue(error);

            await expect(controller.listAdmin(orgId, formId)).rejects.toThrow('Service error');
        });

        it('should propagate service errors for getAdmin', async () => {
            const orgId = 'org-123';
            const submissionId = 'submission-123';

            const error = new Error('Service error');
            jest.spyOn(mockSubmissionsService, 'getSubmission').mockRejectedValue(error);

            await expect(controller.getAdmin(orgId, submissionId)).rejects.toThrow('Service error');
        });
    });
});
