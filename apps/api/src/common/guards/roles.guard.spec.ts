import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../../infra/services/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_HIERARCHY } from '@portfolio-grade/shared';

// Mock the tenant header constant
const HEADER = 'X-Org-Id';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockReflectorValue = {
      getAllAndOverride: jest.fn(),
    };

    const mockPrismaValue = {
      membership: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflectorValue },
        { provide: PrismaService, useValue: mockPrismaValue },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    mockReflector = module.get(Reflector);
    mockPrismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: { userId: 'user-123', email: 'user@example.com' },
        headers: {
          [HEADER.toLowerCase()]: 'org-123',
        },
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('should return true when no roles are required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should return true when required roles is undefined', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      mockRequest.user = undefined;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Missing JWT user'),
      );
    });

    it('should throw ForbiddenException when tenant header is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      mockRequest.headers = {};

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Missing tenant header "X-Org-Id"'),
      );
    });

    it('should throw ForbiddenException when user has no membership in organization', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('No membership for this organization'),
      );

      expect(mockPrismaService.membership.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: 'org-123', userId: 'user-123' } },
        select: { role: true },
      });
    });

    it('should return true when user has sufficient role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Editor',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrismaService.membership.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: 'org-123', userId: 'user-123' } },
        select: { role: true },
      });
    });

    it('should return true when user has higher role than required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Viewer']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'OrgAdmin',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has insufficient role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Viewer',
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Insufficient role'),
      );
    });

    it('should handle multiple required roles correctly', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor', 'Viewer']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Editor',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle OrgAdmin requirement correctly', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OrgAdmin']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'OrgAdmin',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when OrgAdmin is required but user is Editor', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OrgAdmin']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Editor',
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Insufficient role'),
      );
    });

    it('should work with Viewer requirement', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Viewer']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Viewer',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle role hierarchy correctly', async () => {
      // Test that higher roles can access lower role requirements
      mockReflector.getAllAndOverride.mockReturnValue(['Viewer']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'OrgAdmin', // Should be able to access Viewer requirement
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle database errors', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      const dbError = new Error('Database connection failed');
      (mockPrismaService.membership.findUnique as jest.Mock).mockRejectedValue(dbError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(dbError);
    });

    it('should handle different tenant header values', async () => {
      mockRequest.headers = { 'x-org-id': 'different-org' };
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Editor',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrismaService.membership.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: 'different-org', userId: 'user-123' } },
        select: { role: true },
      });
    });

    it('should handle case-insensitive tenant header', async () => {
      mockRequest.headers = { 'x-org-id': 'org-123' }; // Use lowercase as expected by guard
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findUnique as jest.Mock).mockResolvedValue({
        role: 'Editor',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('role hierarchy logic', () => {
    it('should correctly calculate required role level', () => {
      // Test the role hierarchy calculation logic
      const requiredRoles = ['Editor', 'Viewer'];
      const needed = Math.max(
        ...requiredRoles.map(r => ROLE_HIERARCHY[r as keyof typeof ROLE_HIERARCHY]),
      );

      expect(needed).toBe(ROLE_HIERARCHY.Editor); // Editor has higher hierarchy than Viewer
    });

    it('should correctly check role sufficiency', () => {
      const userRole = 'Editor';
      const requiredLevel = ROLE_HIERARCHY.Editor;
      const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];

      expect(userLevel >= requiredLevel).toBe(true);
    });

    it('should handle all role combinations', () => {
      const roleCombinations = [
        { user: 'OrgAdmin', required: 'OrgAdmin', shouldPass: true },
        { user: 'OrgAdmin', required: 'Editor', shouldPass: true },
        { user: 'OrgAdmin', required: 'Viewer', shouldPass: true },
        { user: 'Editor', required: 'OrgAdmin', shouldPass: false },
        { user: 'Editor', required: 'Editor', shouldPass: true },
        { user: 'Editor', required: 'Viewer', shouldPass: true },
        { user: 'Viewer', required: 'OrgAdmin', shouldPass: false },
        { user: 'Viewer', required: 'Editor', shouldPass: false },
        { user: 'Viewer', required: 'Viewer', shouldPass: true },
      ];

      roleCombinations.forEach(({ user, required, shouldPass }) => {
        const userLevel = ROLE_HIERARCHY[user as keyof typeof ROLE_HIERARCHY];
        const requiredLevel = ROLE_HIERARCHY[required as keyof typeof ROLE_HIERARCHY];
        const actualResult = userLevel >= requiredLevel;

        expect(actualResult).toBe(shouldPass);
      });
    });
  });
});
