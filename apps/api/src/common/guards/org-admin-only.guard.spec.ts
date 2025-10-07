import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgAdminOnlyGuard } from './org-admin-only.guard';
import { PrismaService } from '../../infra/services/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_HIERARCHY } from '@portfolio-grade/shared';

describe('OrgAdminOnlyGuard', () => {
  let guard: OrgAdminOnlyGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockReflectorValue = {
      getAllAndOverride: jest.fn(),
    };

    const mockPrismaValue = {
      membership: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgAdminOnlyGuard,
        { provide: Reflector, useValue: mockReflectorValue },
        { provide: PrismaService, useValue: mockPrismaValue },
      ],
    }).compile();

    guard = module.get<OrgAdminOnlyGuard>(OrgAdminOnlyGuard);
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
        headers: {},
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

    it('should throw ForbiddenException when user has no memberships', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('No organization memberships found'),
      );

      expect(mockPrismaService.membership.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { role: true },
      });
    });

    it('should return true when user has sufficient role in any organization', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findMany as jest.Mock as jest.Mock).mockResolvedValue([
        { role: 'OrgAdmin' },
        { role: 'Viewer' },
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrismaService.membership.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { role: true },
      });
    });

    it('should return true when user has exact required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([{ role: 'Editor' }]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has insufficient role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([{ role: 'Viewer' }]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Insufficient role in any organization'),
      );
    });

    it('should handle multiple required roles correctly', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor', 'Viewer']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([{ role: 'Editor' }]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle OrgAdmin requirement correctly', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OrgAdmin']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([
        { role: 'OrgAdmin' },
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when OrgAdmin is required but user is Editor', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OrgAdmin']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([{ role: 'Editor' }]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Insufficient role in any organization'),
      );
    });

    it('should work with Viewer requirement', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Viewer']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([{ role: 'Viewer' }]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle role hierarchy correctly', async () => {
      // Test that higher roles can access lower role requirements
      mockReflector.getAllAndOverride.mockReturnValue(['Viewer']);
      (mockPrismaService.membership.findMany as jest.Mock).mockResolvedValue([
        { role: 'OrgAdmin' }, // Should be able to access Viewer requirement
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle database errors', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['Editor']);
      const dbError = new Error('Database connection failed');
      (mockPrismaService.membership.findMany as jest.Mock).mockRejectedValue(dbError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(dbError);
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
  });
});
