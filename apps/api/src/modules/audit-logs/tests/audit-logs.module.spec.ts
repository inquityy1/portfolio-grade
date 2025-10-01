import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsModule } from '../audit-logs.module';
import { AuditLogsController } from '../audit-logs.controller';
import { AuditLogsService } from '../audit-logs.service';

describe('AuditLogsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuditLogsModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuditLogsController', () => {
    const controller = module.get<AuditLogsController>(AuditLogsController);
    expect(controller).toBeDefined();
  });

  it('should provide AuditLogsService', () => {
    const service = module.get<AuditLogsService>(AuditLogsService);
    expect(service).toBeDefined();
  });

  it('should have correct module structure', () => {
    // Module is already defined and imported successfully
    expect(module).toBeDefined();
  });
});
