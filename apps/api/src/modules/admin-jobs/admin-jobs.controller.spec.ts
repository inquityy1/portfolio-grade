import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsController } from './admin-jobs.controller';

describe('AdminJobsController', () => {
  let controller: AdminJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminJobsController],
    }).compile();

    controller = module.get<AdminJobsController>(AdminJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
