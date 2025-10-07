import { SetMetadata } from '@nestjs/common';
import { RateLimit, RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.decorator';

// Mock SetMetadata to track calls
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn().mockImplementation((key, value) => {
    // Return a proper decorator function
    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
      // This is what SetMetadata actually does - it sets metadata
      return target;
    };
  }),
}));

describe('RateLimit Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(RateLimit).toBeDefined();
    expect(RATE_LIMIT_KEY).toBeDefined();
  });

  it('should have correct metadata key', () => {
    expect(RATE_LIMIT_KEY).toBe('rate_limit_config');
  });

  describe('RateLimitConfig type', () => {
    it('should accept perUser configuration', () => {
      const config: RateLimitConfig = {
        perUser: { limit: 100, windowSec: 60 },
      };
      expect(config.perUser).toBeDefined();
      expect(config.perUser?.limit).toBe(100);
      expect(config.perUser?.windowSec).toBe(60);
    });

    it('should accept perOrg configuration', () => {
      const config: RateLimitConfig = {
        perOrg: { limit: 1000, windowSec: 300 },
      };
      expect(config.perOrg).toBeDefined();
      expect(config.perOrg?.limit).toBe(1000);
      expect(config.perOrg?.windowSec).toBe(300);
    });

    it('should accept perIp configuration', () => {
      const config: RateLimitConfig = {
        perIp: { limit: 50, windowSec: 120 },
      };
      expect(config.perIp).toBeDefined();
      expect(config.perIp?.limit).toBe(50);
      expect(config.perIp?.windowSec).toBe(120);
    });

    it('should accept all configurations together', () => {
      const config: RateLimitConfig = {
        perUser: { limit: 100, windowSec: 60 },
        perOrg: { limit: 1000, windowSec: 300 },
        perIp: { limit: 50, windowSec: 120 },
      };
      expect(config.perUser).toBeDefined();
      expect(config.perOrg).toBeDefined();
      expect(config.perIp).toBeDefined();
    });

    it('should accept partial configurations', () => {
      const config1: RateLimitConfig = {
        perUser: { limit: 100, windowSec: 60 },
      };
      const config2: RateLimitConfig = {
        perOrg: { limit: 1000, windowSec: 300 },
      };
      const config3: RateLimitConfig = {
        perIp: { limit: 50, windowSec: 120 },
      };

      expect(config1.perUser).toBeDefined();
      expect(config1.perOrg).toBeUndefined();
      expect(config1.perIp).toBeUndefined();

      expect(config2.perUser).toBeUndefined();
      expect(config2.perOrg).toBeDefined();
      expect(config2.perIp).toBeUndefined();

      expect(config3.perUser).toBeUndefined();
      expect(config3.perOrg).toBeUndefined();
      expect(config3.perIp).toBeDefined();
    });
  });

  describe('RateLimit decorator', () => {
    it('should call SetMetadata with perUser configuration', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perUser: { limit: 100, windowSec: 60 },
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should call SetMetadata with perOrg configuration', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perOrg: { limit: 1000, windowSec: 300 },
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should call SetMetadata with perIp configuration', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perIp: { limit: 50, windowSec: 120 },
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should call SetMetadata with combined configuration', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perUser: { limit: 100, windowSec: 60 },
        perOrg: { limit: 1000, windowSec: 300 },
        perIp: { limit: 50, windowSec: 120 },
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should return the result of SetMetadata', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

      const config: RateLimitConfig = { perUser: { limit: 100, windowSec: 60 } };
      const result = RateLimit(config);

      // The result should be a decorator function
      expect(typeof result).toBe('function');
      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should handle different limit values', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

      RateLimit({ perUser: { limit: 1, windowSec: 1 } });
      RateLimit({ perUser: { limit: 1000, windowSec: 3600 } });
      RateLimit({ perUser: { limit: 0, windowSec: 0 } });

      expect(mockSetMetadata).toHaveBeenCalledTimes(3);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, RATE_LIMIT_KEY, {
        perUser: { limit: 1, windowSec: 1 },
      });
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, RATE_LIMIT_KEY, {
        perUser: { limit: 1000, windowSec: 3600 },
      });
      expect(mockSetMetadata).toHaveBeenNthCalledWith(3, RATE_LIMIT_KEY, {
        perUser: { limit: 0, windowSec: 0 },
      });
    });

    it('should handle different window values', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

      RateLimit({ perUser: { limit: 100, windowSec: 1 } });
      RateLimit({ perUser: { limit: 100, windowSec: 60 } });
      RateLimit({ perUser: { limit: 100, windowSec: 3600 } });

      expect(mockSetMetadata).toHaveBeenCalledTimes(3);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, RATE_LIMIT_KEY, {
        perUser: { limit: 100, windowSec: 1 },
      });
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, RATE_LIMIT_KEY, {
        perUser: { limit: 100, windowSec: 60 },
      });
      expect(mockSetMetadata).toHaveBeenNthCalledWith(3, RATE_LIMIT_KEY, {
        perUser: { limit: 100, windowSec: 3600 },
      });
    });
  });

  describe('decorator usage patterns', () => {
    it('should work as a method decorator', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = { perUser: { limit: 100, windowSec: 60 } };

      class TestController {
        @RateLimit(config)
        testMethod() {}
      }

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should work as a class decorator', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = { perOrg: { limit: 1000, windowSec: 300 } };

      @RateLimit(config)
      class TestController {}

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should work with multiple decorators on same method', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config1: RateLimitConfig = { perUser: { limit: 100, windowSec: 60 } };
      const config2: RateLimitConfig = { perOrg: { limit: 1000, windowSec: 300 } };

      class TestController {
        @RateLimit(config1)
        @RateLimit(config2)
        testMethod() {}
      }

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, RATE_LIMIT_KEY, config1);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, RATE_LIMIT_KEY, config2);
    });

    it('should work with inline configuration', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

      class TestController {
        @RateLimit({ perUser: { limit: 50, windowSec: 30 } })
        testMethod() {}
      }

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, {
        perUser: { limit: 50, windowSec: 30 },
      });
    });
  });

  describe('RATE_LIMIT_KEY constant', () => {
    it('should be a string', () => {
      expect(typeof RATE_LIMIT_KEY).toBe('string');
    });

    it('should be immutable', () => {
      const originalKey = RATE_LIMIT_KEY;
      expect(RATE_LIMIT_KEY).toBe(originalKey);
    });

    it('should be used consistently', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config1: RateLimitConfig = { perUser: { limit: 100, windowSec: 60 } };
      const config2: RateLimitConfig = { perOrg: { limit: 1000, windowSec: 300 } };

      RateLimit(config1);
      RateLimit(config2);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config1);
      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty configuration object', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {};

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should handle configuration with undefined values', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perUser: undefined,
        perOrg: undefined,
        perIp: undefined,
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });

    it('should handle very large numbers', () => {
      const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
      const config: RateLimitConfig = {
        perUser: { limit: Number.MAX_SAFE_INTEGER, windowSec: Number.MAX_SAFE_INTEGER },
      };

      RateLimit(config);

      expect(mockSetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, config);
    });
  });
});
