import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsModule } from '../admin-jobs.module';
import { AdminJobsController } from '../admin-jobs.controller';
import { InfraModule } from '../../../infra/infra.module';

describe('AdminJobsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminJobsModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AdminJobsController', () => {
    const controller = module.get<AdminJobsController>(AdminJobsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AdminJobsController);
  });

  it('should import InfraModule', () => {
    // The module should be able to resolve dependencies from InfraModule
    const controller = module.get<AdminJobsController>(AdminJobsController);
    expect(controller).toBeDefined();
  });
});
