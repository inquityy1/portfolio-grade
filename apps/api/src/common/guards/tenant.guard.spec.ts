import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { TENANT_HEADER } from '../constants/tenancy';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
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
        headers: {
          [TENANT_HEADER]: 'org-123',
        },
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;
    });

    it('should return true when tenant header is present', () => {
      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.orgId).toBe('org-123');
    });

    it('should throw ForbiddenException when tenant header is missing', () => {
      mockRequest.headers = {};

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException(`Missing tenant header "${TENANT_HEADER}"`),
      );
    });

    it('should throw ForbiddenException when tenant header is undefined', () => {
      mockRequest.headers = {
        [TENANT_HEADER]: undefined,
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException(`Missing tenant header "${TENANT_HEADER}"`),
      );
    });

    it('should throw ForbiddenException when tenant header is null', () => {
      mockRequest.headers = {
        [TENANT_HEADER]: null,
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException(`Missing tenant header "${TENANT_HEADER}"`),
      );
    });

    it('should throw ForbiddenException when tenant header is empty string', () => {
      mockRequest.headers = {
        [TENANT_HEADER]: '',
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException(`Missing tenant header "${TENANT_HEADER}"`),
      );
    });

    it('should attach orgId to request when tenant header is present', () => {
      const orgId = 'test-org-456';
      mockRequest.headers = {
        [TENANT_HEADER]: orgId,
      };

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.orgId).toBe(orgId);
    });

    it('should handle different tenant header values', () => {
      const testCases = [
        'org-123',
        'tenant-456',
        'company-789',
        'organization-abc',
        'multi-word-org-name',
      ];

      testCases.forEach(orgId => {
        mockRequest.headers = {
          [TENANT_HEADER]: orgId,
        };

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockRequest.orgId).toBe(orgId);
      });
    });

    it('should handle case-sensitive tenant header', () => {
      // Test that the header key is case-sensitive
      mockRequest.headers = {
        [TENANT_HEADER]: 'org-123',
        'X-ORG-ID': 'different-org', // Different case
      };

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.orgId).toBe('org-123');
    });

    it('should not modify request when tenant header is missing', () => {
      const testRequest = {
        headers: {}, // No tenant header
      };

      const testContext = {
        switchToHttp: () => ({
          getRequest: () => testRequest,
        }),
      } as any;

      expect(() => guard.canActivate(testContext)).toThrow(ForbiddenException);

      // Request should not be modified when header is missing
      expect(testRequest.headers).toEqual({});
    });

    it('should handle numeric tenant header values', () => {
      mockRequest.headers = {
        [TENANT_HEADER]: '12345',
      };

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.orgId).toBe('12345');
    });

    it('should handle special characters in tenant header', () => {
      const specialOrgId = 'org-with-special-chars_123';
      mockRequest.headers = {
        [TENANT_HEADER]: specialOrgId,
      };

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.orgId).toBe(specialOrgId);
    });
  });

  describe('guard behavior', () => {
    it('should be synchronous', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { [TENANT_HEADER]: 'org-123' },
          }),
        }),
      } as any;

      const result = guard.canActivate(mockContext);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should not require any dependencies', () => {
      // The guard should work without any injected dependencies
      const standaloneGuard = new TenantGuard();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { [TENANT_HEADER]: 'org-123' },
          }),
        }),
      } as any;

      const result = standaloneGuard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should provide clear error message', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as any;

      try {
        guard.canActivate(mockContext);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(`Missing tenant header "${TENANT_HEADER}"`);
      }
    });

    it('should handle malformed context gracefully', () => {
      const malformedContext = {
        switchToHttp: () => ({
          getRequest: () => null,
        }),
      } as any;

      expect(() => guard.canActivate(malformedContext)).toThrow();
    });
  });
});
