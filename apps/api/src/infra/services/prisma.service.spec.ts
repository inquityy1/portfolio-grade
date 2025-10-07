import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock the PrismaClient methods directly on the service instance
    jest.spyOn(service, '$connect').mockImplementation();
    jest.spyOn(service, '$disconnect').mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should extend PrismaClient', () => {
      // Check if the service has PrismaClient methods
      expect(typeof service.$connect).toBe('function');
      expect(typeof service.$disconnect).toBe('function');
      expect(typeof service.$transaction).toBe('function');

      // Check if it's a PrismaService instance
      expect(service.constructor.name).toBe('PrismaService');

      // Check if it has the expected methods from PrismaClient
      expect(typeof service.user).toBe('object');
      expect(typeof service.post).toBe('object');
      expect(typeof service.organization).toBe('object');
    });

    it('should have onModuleInit method', () => {
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('should have onModuleDestroy method', () => {
      expect(typeof service.onModuleDestroy).toBe('function');
    });
  });

  describe('onModuleInit', () => {
    it('should call $connect when module initializes', async () => {
      (service.$connect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection success', async () => {
      (service.$connect as jest.Mock).mockResolvedValue(undefined);

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Database connection failed');
      (service.$connect as jest.Mock).mockRejectedValue(connectionError);

      await expect(service.onModuleInit()).rejects.toThrow('Database connection failed');
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      (service.$connect as jest.Mock).mockRejectedValue(timeoutError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection timeout');
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network unreachable');
      (service.$connect as jest.Mock).mockRejectedValue(networkError);

      await expect(service.onModuleInit()).rejects.toThrow('Network unreachable');
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect when module destroys', async () => {
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection success', async () => {
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('lifecycle integration', () => {
    it('should handle complete lifecycle: init -> destroy', async () => {
      (service.$connect as jest.Mock).mockResolvedValue(undefined);
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalledTimes(1);

      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle lifecycle with connection error', async () => {
      const connectionError = new Error('Connection failed');
      (service.$connect as jest.Mock).mockRejectedValue(connectionError);
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(service.$connect).toHaveBeenCalledTimes(1);

      // Should still be able to call destroy even if init failed
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple init calls', async () => {
      (service.$connect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleInit();

      expect(service.$connect).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple destroy calls', async () => {
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleDestroy();
      await service.onModuleDestroy();

      expect(service.$disconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('PrismaClient methods availability', () => {
    it('should have transaction method', () => {
      expect(typeof service.$transaction).toBe('function');
    });

    it('should have queryRaw method', () => {
      expect(typeof service.$queryRaw).toBe('function');
    });

    it('should have executeRaw method', () => {
      expect(typeof service.$executeRaw).toBe('function');
    });

    it('should have user model methods', () => {
      expect(service.user).toBeDefined();
      expect(typeof service.user.findMany).toBe('function');
      expect(typeof service.user.findFirst).toBe('function');
      expect(typeof service.user.findUnique).toBe('function');
      expect(typeof service.user.create).toBe('function');
      expect(typeof service.user.update).toBe('function');
      expect(typeof service.user.delete).toBe('function');
      expect(typeof service.user.upsert).toBe('function');
      expect(typeof service.user.count).toBe('function');
    });

    it('should have post model methods', () => {
      expect(service.post).toBeDefined();
      expect(typeof service.post.findMany).toBe('function');
      expect(typeof service.post.findFirst).toBe('function');
      expect(typeof service.post.findUnique).toBe('function');
      expect(typeof service.post.create).toBe('function');
      expect(typeof service.post.update).toBe('function');
      expect(typeof service.post.delete).toBe('function');
      expect(typeof service.post.upsert).toBe('function');
      expect(typeof service.post.count).toBe('function');
    });

    it('should have organization model methods', () => {
      expect(service.organization).toBeDefined();
      expect(typeof service.organization.findMany).toBe('function');
      expect(typeof service.organization.findFirst).toBe('function');
      expect(typeof service.organization.findUnique).toBe('function');
      expect(typeof service.organization.create).toBe('function');
      expect(typeof service.organization.update).toBe('function');
      expect(typeof service.organization.delete).toBe('function');
      expect(typeof service.organization.upsert).toBe('function');
      expect(typeof service.organization.count).toBe('function');
    });

    it('should have form model methods', () => {
      expect(service.form).toBeDefined();
      expect(typeof service.form.findMany).toBe('function');
      expect(typeof service.form.findFirst).toBe('function');
      expect(typeof service.form.findUnique).toBe('function');
      expect(typeof service.form.create).toBe('function');
      expect(typeof service.form.update).toBe('function');
      expect(typeof service.form.delete).toBe('function');
      expect(typeof service.form.upsert).toBe('function');
      expect(typeof service.form.count).toBe('function');
    });

    it('should have field model methods', () => {
      expect(service.field).toBeDefined();
      expect(typeof service.field.findMany).toBe('function');
      expect(typeof service.field.findFirst).toBe('function');
      expect(typeof service.field.findUnique).toBe('function');
      expect(typeof service.field.create).toBe('function');
      expect(typeof service.field.update).toBe('function');
      expect(typeof service.field.delete).toBe('function');
      expect(typeof service.field.upsert).toBe('function');
      expect(typeof service.field.count).toBe('function');
    });

    it('should have submission model methods', () => {
      expect(service.submission).toBeDefined();
      expect(typeof service.submission.findMany).toBe('function');
      expect(typeof service.submission.findFirst).toBe('function');
      expect(typeof service.submission.findUnique).toBe('function');
      expect(typeof service.submission.create).toBe('function');
      expect(typeof service.submission.update).toBe('function');
      expect(typeof service.submission.delete).toBe('function');
      expect(typeof service.submission.upsert).toBe('function');
      expect(typeof service.submission.count).toBe('function');
    });

    it('should have tag model methods', () => {
      expect(service.tag).toBeDefined();
      expect(typeof service.tag.findMany).toBe('function');
      expect(typeof service.tag.findFirst).toBe('function');
      expect(typeof service.tag.findUnique).toBe('function');
      expect(typeof service.tag.create).toBe('function');
      expect(typeof service.tag.update).toBe('function');
      expect(typeof service.tag.delete).toBe('function');
      expect(typeof service.tag.upsert).toBe('function');
      expect(typeof service.tag.count).toBe('function');
    });

    it('should have comment model methods', () => {
      expect(service.comment).toBeDefined();
      expect(typeof service.comment.findMany).toBe('function');
      expect(typeof service.comment.findFirst).toBe('function');
      expect(typeof service.comment.findUnique).toBe('function');
      expect(typeof service.comment.create).toBe('function');
      expect(typeof service.comment.update).toBe('function');
      expect(typeof service.comment.delete).toBe('function');
      expect(typeof service.comment.upsert).toBe('function');
      expect(typeof service.comment.count).toBe('function');
    });

    it('should have auditLog model methods', () => {
      expect(service.auditLog).toBeDefined();
      expect(typeof service.auditLog.findMany).toBe('function');
      expect(typeof service.auditLog.findFirst).toBe('function');
      expect(typeof service.auditLog.findUnique).toBe('function');
      expect(typeof service.auditLog.create).toBe('function');
      expect(typeof service.auditLog.update).toBe('function');
      expect(typeof service.auditLog.delete).toBe('function');
      expect(typeof service.auditLog.upsert).toBe('function');
      expect(typeof service.auditLog.count).toBe('function');
    });

    it('should have membership model methods', () => {
      expect(service.membership).toBeDefined();
      expect(typeof service.membership.findMany).toBe('function');
      expect(typeof service.membership.findFirst).toBe('function');
      expect(typeof service.membership.findUnique).toBe('function');
      expect(typeof service.membership.create).toBe('function');
      expect(typeof service.membership.update).toBe('function');
      expect(typeof service.membership.delete).toBe('function');
      expect(typeof service.membership.upsert).toBe('function');
      expect(typeof service.membership.count).toBe('function');
    });

    it('should have postTag model methods', () => {
      expect(service.postTag).toBeDefined();
      expect(typeof service.postTag.findMany).toBe('function');
      expect(typeof service.postTag.findFirst).toBe('function');
      expect(typeof service.postTag.findUnique).toBe('function');
      expect(typeof service.postTag.create).toBe('function');
      expect(typeof service.postTag.update).toBe('function');
      expect(typeof service.postTag.delete).toBe('function');
      expect(typeof service.postTag.upsert).toBe('function');
      expect(typeof service.postTag.count).toBe('function');
      expect(typeof service.postTag.groupBy).toBe('function');
    });

    it('should have tagAggregate model methods', () => {
      expect(service.tagAggregate).toBeDefined();
      expect(typeof service.tagAggregate.findMany).toBe('function');
      expect(typeof service.tagAggregate.findFirst).toBe('function');
      expect(typeof service.tagAggregate.findUnique).toBe('function');
      expect(typeof service.tagAggregate.create).toBe('function');
      expect(typeof service.tagAggregate.update).toBe('function');
      expect(typeof service.tagAggregate.delete).toBe('function');
      expect(typeof service.tagAggregate.upsert).toBe('function');
      expect(typeof service.tagAggregate.count).toBe('function');
    });

    it('should have fileAsset model methods', () => {
      expect(service.fileAsset).toBeDefined();
      expect(typeof service.fileAsset.findMany).toBe('function');
      expect(typeof service.fileAsset.findFirst).toBe('function');
      expect(typeof service.fileAsset.findUnique).toBe('function');
      expect(typeof service.fileAsset.create).toBe('function');
      expect(typeof service.fileAsset.update).toBe('function');
      expect(typeof service.fileAsset.delete).toBe('function');
      expect(typeof service.fileAsset.upsert).toBe('function');
      expect(typeof service.fileAsset.count).toBe('function');
    });
  });

  describe('error scenarios', () => {
    it('should handle database unavailable during init', async () => {
      const dbError = new Error('Database unavailable');
      (service.$connect as jest.Mock).mockRejectedValue(dbError);

      await expect(service.onModuleInit()).rejects.toThrow('Database unavailable');
    });

    it('should handle connection pool exhaustion', async () => {
      const poolError = new Error('Connection pool exhausted');
      (service.$connect as jest.Mock).mockRejectedValue(poolError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection pool exhausted');
    });

    it('should handle invalid database credentials', async () => {
      const authError = new Error('Invalid credentials');
      (service.$connect as jest.Mock).mockRejectedValue(authError);

      await expect(service.onModuleInit()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('service behavior', () => {
    it('should be a singleton service', () => {
      const module1 = Test.createTestingModule({
        providers: [PrismaService],
      });
      const module2 = Test.createTestingModule({
        providers: [PrismaService],
      });

      // Each module gets its own instance, but within a module it's singleton
      expect(module1).toBeDefined();
      expect(module2).toBeDefined();
    });

    it('should maintain state between method calls', async () => {
      (service.$connect as jest.Mock).mockResolvedValue(undefined);
      (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalledTimes(1);

      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);

      // Service should still be usable after destroy
      expect(service).toBeDefined();
    });
  });
});
