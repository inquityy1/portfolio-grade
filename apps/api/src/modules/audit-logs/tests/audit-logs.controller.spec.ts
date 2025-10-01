import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from '../audit-logs.controller';
import { AuditLogsService } from '../audit-logs.service';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  const mockAuditLogsService = {
    list: jest.fn(),
  };

  const mockPrismaService = {
    auditLog: {
      findMany: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const mockRateLimitService = {
    checkLimit: jest.fn(),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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

    controller = module.get<AuditLogsController>(AuditLogsController);
    auditLogsService = module.get(AuditLogsService);
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

    it('should return audit logs for organization', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const result = await controller.list(orgId, {});

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, {});
    });

    it('should pass query parameters to service', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const query = {
        resource: 'Post',
        action: 'CREATE',
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
        take: 50,
        cursor: 'cursor-id',
      };

      const result = await controller.list(orgId, query);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, query);
    });

    it('should handle empty query parameters', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const result = await controller.list(orgId, {});

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, {});
    });

    it('should handle partial query parameters', async () => {
      mockAuditLogsService.list.mockResolvedValue([mockAuditLogs[0]]);

      const query = { resource: 'Post' };

      const result = await controller.list(orgId, query);

      expect(result).toEqual([mockAuditLogs[0]]);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, query);
    });

    it('should return empty array when no logs found', async () => {
      mockAuditLogsService.list.mockResolvedValue([]);

      const result = await controller.list(orgId, {});

      expect(result).toEqual([]);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, {});
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockAuditLogsService.list.mockRejectedValue(error);

      await expect(controller.list(orgId, {})).rejects.toThrow('Database connection failed');
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, {});
    });

    it('should handle invalid query parameters gracefully', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const invalidQuery = {
        resource: '',
        action: null,
        take: 'invalid',
        cursor: undefined,
      };

      const result = await controller.list(orgId, invalidQuery);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, invalidQuery);
    });

    it('should handle date range queries', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const dateQuery = {
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      };

      const result = await controller.list(orgId, dateQuery);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, dateQuery);
    });

    it('should handle pagination queries', async () => {
      mockAuditLogsService.list.mockResolvedValue(mockAuditLogs);

      const paginationQuery = {
        take: 10,
        cursor: 'cursor-id',
      };

      const result = await controller.list(orgId, paginationQuery);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsService.list).toHaveBeenCalledWith(orgId, paginationQuery);
    });
  });
});
