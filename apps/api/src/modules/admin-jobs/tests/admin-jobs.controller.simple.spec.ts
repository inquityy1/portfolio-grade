import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsController } from '../admin-jobs.controller';
import { TagStatsProcessor } from '../../../infra/jobs/processors/tag-stats.processor';
import { PostPreviewProcessor } from '../../../infra/jobs/processors/post-preview.processor';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

// Mock the PrismaService
const mockPrismaService = {
    tagAggregate: {
        findMany: jest.fn(),
    },
    post: {
        findFirst: jest.fn(),
    },
    fileAsset: {
        create: jest.fn(),
    },
};

// Mock the processors
const mockTagStatsProcessor = {
    enqueue: jest.fn(),
};

const mockPostPreviewProcessor = {
    enqueue: jest.fn(),
};

// Mock the Reflector for guards
const mockReflector = {
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
};

// Mock the RateLimitService for RateLimitGuard
const mockRateLimitService = {
    checkLimit: jest.fn(),
    increment: jest.fn(),
};

describe('AdminJobsController', () => {
    let controller: AdminJobsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminJobsController],
            providers: [
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: TagStatsProcessor,
                    useValue: mockTagStatsProcessor,
                },
                {
                    provide: PostPreviewProcessor,
                    useValue: mockPostPreviewProcessor,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: RateLimitService,
                    useValue: mockRateLimitService,
                },
            ],
        }).compile();

        controller = module.get<AdminJobsController>(AdminJobsController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getTagStats', () => {
        it('should return tag statistics for organization', async () => {
            const orgId = 'test-org-id';
            const mockTagStats = [
                {
                    id: 'stat-1',
                    tagId: 'tag-1',
                    organizationId: orgId,
                    count: 10,
                    calculatedAt: new Date('2024-01-15T10:30:00Z'),
                },
            ];

            mockPrismaService.tagAggregate.findMany.mockResolvedValue(mockTagStats);

            const result = await controller.getTagStats(orgId);

            expect(result).toEqual(mockTagStats);
            expect(mockPrismaService.tagAggregate.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { count: 'asc' },
            });
        });
    });

    describe('runTagStats', () => {
        it('should enqueue tag stats job and return success response', async () => {
            const orgId = 'test-org-id';
            mockTagStatsProcessor.enqueue.mockResolvedValue(undefined);

            const result = await controller.runTagStats(orgId);

            expect(result).toEqual({ ok: true, queued: true });
            expect(mockTagStatsProcessor.enqueue).toHaveBeenCalledWith(orgId);
        });
    });

    describe('runPreview', () => {
        it('should enqueue preview job when Redis is available', async () => {
            const orgId = 'test-org-id';
            const postId = 'test-post-id';
            const mockJob = { id: 'job-1', data: { orgId, postId } };

            mockPostPreviewProcessor.enqueue.mockResolvedValue(mockJob);

            const result = await controller.runPreview(orgId, postId);

            expect(result).toEqual({ ok: true, queued: true });
            expect(mockPostPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
        });

        it('should generate preview synchronously when Redis is unavailable', async () => {
            const orgId = 'test-org-id';
            const postId = 'test-post-id';
            const mockPost = {
                id: postId,
                organizationId: orgId,
                title: 'Test Post',
                content: 'Test content',
            };

            mockPostPreviewProcessor.enqueue.mockResolvedValue(null);
            mockPrismaService.post.findFirst.mockResolvedValue(mockPost);
            mockPrismaService.fileAsset.create.mockResolvedValue({
                id: 'asset-1',
                url: `https://picsum.photos/seed/${postId}/1200/630`,
                mimeType: 'image/jpeg',
                postId,
            });

            const result = await controller.runPreview(orgId, postId);

            expect(result).toEqual({
                ok: true,
                generated: true,
                message: 'Preview generated synchronously',
            });
            expect(mockPostPreviewProcessor.enqueue).toHaveBeenCalledWith(orgId, postId);
            expect(mockPrismaService.post.findFirst).toHaveBeenCalledWith({
                where: { id: postId, organizationId: orgId },
            });
            expect(mockPrismaService.fileAsset.create).toHaveBeenCalledWith({
                data: {
                    url: `https://picsum.photos/seed/${postId}/1200/630`,
                    mimeType: 'image/jpeg',
                    postId,
                },
            });
        });
    });
});
