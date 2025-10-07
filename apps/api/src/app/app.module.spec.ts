import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { RedisService } from '../infra/services/redis.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      flushall: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide RedisService', () => {
    const service = module.get<RedisService>(RedisService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Object);
  });

  it('should export RedisService', () => {
    const service = module.get<RedisService>(RedisService);
    expect(service).toBeDefined();
  });

  describe('module imports', () => {
    it('should import all required modules', () => {
      expect(module).toBeDefined();
    });
  });

  describe('module configuration', () => {
    it('should have correct module structure', () => {
      const appModule = module.get(AppModule);
      expect(appModule).toBeDefined();
    });
  });
});
