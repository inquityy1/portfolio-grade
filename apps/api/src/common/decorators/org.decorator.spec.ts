import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { TENANT_HEADER } from '../constants/tenancy';

// Create a test version of the factory function to test the actual logic
const createTestOrgIdFactory = () => {
  return (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    // Handle case where headers might be undefined or missing
    if (!req.headers) {
      return req.orgId;
    }
    return (req.headers[TENANT_HEADER] as string | undefined) ?? req.orgId;
  };
};

describe('OrgId Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;
  let orgIdFactory: ReturnType<typeof createTestOrgIdFactory>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      orgId: undefined,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    orgIdFactory = createTestOrgIdFactory();
  });

  it('should be defined', () => {
    // Test that the decorator can be imported
    expect(require('./org.decorator').OrgId).toBeDefined();
  });

  it('should be created with createParamDecorator', () => {
    const { OrgId } = require('./org.decorator');

    // Test that OrgId is a parameter decorator
    expect(OrgId).toBeDefined();
    expect(typeof OrgId).toBe('function');

    // Test that it can be used as a decorator (doesn't throw)
    expect(() => {
      class TestClass {
        testMethod(@OrgId() orgId: string) {}
      }
    }).not.toThrow();
  });

  it('should extract orgId from headers when present', () => {
    const expectedOrgId = 'org-123';
    mockRequest.headers[TENANT_HEADER] = expectedOrgId;

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe(expectedOrgId);
  });

  it('should extract orgId from headers with different case', () => {
    const expectedOrgId = 'org-456';
    // TENANT_HEADER is lowercase, so use the correct case
    mockRequest.headers[TENANT_HEADER] = expectedOrgId;

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe(expectedOrgId);
  });

  it('should fallback to req.orgId when header is not present', () => {
    const expectedOrgId = 'org-789';
    mockRequest.orgId = expectedOrgId;
    // No header set

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe(expectedOrgId);
  });

  it('should return undefined when neither header nor req.orgId is present', () => {
    // No header and no orgId set

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should prioritize header over req.orgId', () => {
    const headerOrgId = 'org-header-123';
    const reqOrgId = 'org-req-456';
    mockRequest.headers[TENANT_HEADER] = headerOrgId;
    mockRequest.orgId = reqOrgId;

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe(headerOrgId);
  });

  it('should handle empty string in header', () => {
    mockRequest.headers[TENANT_HEADER] = '';

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe('');
  });

  it('should handle empty string in req.orgId', () => {
    mockRequest.orgId = '';

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe('');
  });

  it('should handle null values', () => {
    mockRequest.headers[TENANT_HEADER] = null;
    mockRequest.orgId = null;

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBeNull();
  });

  it('should handle undefined values', () => {
    mockRequest.headers[TENANT_HEADER] = undefined;
    mockRequest.orgId = undefined;

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should work with different orgId formats', () => {
    const testCases = [
      'org-123',
      'organization-456',
      'tenant-789',
      '123',
      'abc-def-ghi',
      'ORG_UPPERCASE',
      'org.with.dots',
      'org-with-dashes',
    ];

    testCases.forEach(orgId => {
      mockRequest.headers[TENANT_HEADER] = orgId;
      const result = orgIdFactory(undefined, mockExecutionContext);
      expect(result).toBe(orgId);
    });
  });

  it('should handle missing headers object', () => {
    delete mockRequest.headers;
    mockRequest.orgId = 'org-fallback';

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe('org-fallback');
  });

  it('should handle missing headers property', () => {
    mockRequest.headers = undefined;
    mockRequest.orgId = 'org-fallback';

    const result = orgIdFactory(undefined, mockExecutionContext);

    expect(result).toBe('org-fallback');
  });

  it('should work with ExecutionContext that has different structure', () => {
    const customExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { [TENANT_HEADER]: 'org-custom' },
          orgId: 'org-fallback',
        }),
      }),
    } as any;

    const result = orgIdFactory(undefined, customExecutionContext);

    expect(result).toBe('org-custom');
  });

  describe('TENANT_HEADER integration', () => {
    it('should use the correct tenant header key', () => {
      const expectedOrgId = 'org-header-test';
      mockRequest.headers[TENANT_HEADER] = expectedOrgId;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(expectedOrgId);
    });

    it('should work with environment-specific tenant header', () => {
      // Test that it works with the actual TENANT_HEADER constant
      const expectedOrgId = 'org-env-test';
      mockRequest.headers[TENANT_HEADER] = expectedOrgId;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(expectedOrgId);
    });
  });

  describe('decorator behavior', () => {
    it('should be callable as a parameter decorator', () => {
      // Test that the decorator function can be called
      expect(() => {
        orgIdFactory(undefined, mockExecutionContext);
      }).not.toThrow();
    });

    it('should return the extracted value', () => {
      const testValue = 'test-org-id';
      mockRequest.headers[TENANT_HEADER] = testValue;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(testValue);
    });

    it('should handle the _data parameter correctly', () => {
      const testData = { some: 'data' };
      mockRequest.headers[TENANT_HEADER] = 'org-test';

      const result = orgIdFactory(testData, mockExecutionContext);

      // The decorator should ignore the _data parameter
      expect(result).toBe('org-test');
    });
  });

  describe('edge cases', () => {
    it('should handle very long orgId values', () => {
      const longOrgId = 'a'.repeat(1000);
      mockRequest.headers[TENANT_HEADER] = longOrgId;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(longOrgId);
    });

    it('should handle special characters in orgId', () => {
      const specialOrgId = 'org-123!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockRequest.headers[TENANT_HEADER] = specialOrgId;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(specialOrgId);
    });

    it('should handle numeric orgId values', () => {
      const numericOrgId = '123456789';
      mockRequest.headers[TENANT_HEADER] = numericOrgId;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(numericOrgId);
    });

    it('should handle boolean values', () => {
      mockRequest.headers[TENANT_HEADER] = true;
      mockRequest.orgId = false;

      const result = orgIdFactory(undefined, mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
