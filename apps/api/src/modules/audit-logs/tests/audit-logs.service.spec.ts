import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from '../audit-logs.service';
import { PrismaService } from '../../../infra/services/prisma.service';

describe('AuditLogsService', () => {
    let service: AuditLogsService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        auditLog: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AuditLogsService>(AuditLogsService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        const orgId = 'test-org-id';
        const mockAuditLogs = [
            {
                id: 'log-1',
                at: new Date('2024-01-15T10:30:00Z'),
                userId: 'user-1',
                action: 'CREATE',
                resource: 'Post',
                resourceId: 'post-1',
            },
            {
                id: 'log-2',
                at: new Date('2024-01-14T09:15:00Z'),
                userId: 'user-2',
                action: 'UPDATE',
                resource: 'User',
                resourceId: 'user-2',
            },
        ];

        it('should return audit logs with default pagination', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const result = await service.list(orgId, {});

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { at: 'desc' },
                take: 20,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply resource filter', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLogs[0]]);

            const result = await service.list(orgId, { resource: 'Post' });

            expect(result).toEqual([mockAuditLogs[0]]);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId, resource: 'Post' },
                orderBy: { at: 'desc' },
                take: 20,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply action filter', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLogs[0]]);

            const result = await service.list(orgId, { action: 'CREATE' });

            expect(result).toEqual([mockAuditLogs[0]]);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId, action: 'CREATE' },
                orderBy: { at: 'desc' },
                take: 20,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply date range filters', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const fromDate = '2024-01-01T00:00:00Z';
            const toDate = '2024-01-31T23:59:59Z';

            const result = await service.list(orgId, { from: fromDate, to: toDate });

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId: orgId,
                    at: {
                        gte: new Date(fromDate),
                        lte: new Date(toDate),
                    },
                },
                orderBy: { at: 'desc' },
                take: 20,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply custom take limit', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const result = await service.list(orgId, { take: 50 });

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { at: 'desc' },
                take: 50,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should enforce minimum take limit of 1', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const result = await service.list(orgId, { take: 0 });

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { at: 'desc' },
                take: 1,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should enforce maximum take limit of 100', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const result = await service.list(orgId, { take: 150 });

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { at: 'desc' },
                take: 100,
                skip: 0,
                cursor: undefined,
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply cursor-based pagination', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

            const cursor = 'cursor-id';

            const result = await service.list(orgId, { cursor });

            expect(result).toEqual(mockAuditLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { at: 'desc' },
                take: 20,
                skip: 1,
                cursor: { id: cursor },
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should apply multiple filters together', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLogs[0]]);

            const filters = {
                resource: 'Post',
                action: 'CREATE',
                from: '2024-01-01T00:00:00Z',
                to: '2024-01-31T23:59:59Z',
                take: 10,
                cursor: 'cursor-id',
            };

            const result = await service.list(orgId, filters);

            expect(result).toEqual([mockAuditLogs[0]]);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId: orgId,
                    resource: 'Post',
                    action: 'CREATE',
                    at: {
                        gte: new Date('2024-01-01T00:00:00Z'),
                        lte: new Date('2024-01-31T23:59:59Z'),
                    },
                },
                orderBy: { at: 'desc' },
                take: 10,
                skip: 1,
                cursor: { id: 'cursor-id' },
                select: {
                    id: true,
                    at: true,
                    userId: true,
                    action: true,
                    resource: true,
                    resourceId: true,
                },
            });
        });

        it('should return empty array when no logs found', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue([]);

            const result = await service.list(orgId, {});

            expect(result).toEqual([]);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledTimes(1);
        });
    });
});
