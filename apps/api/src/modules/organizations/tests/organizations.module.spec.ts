import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsModule } from '../organizations.module';
import { OrganizationsService } from '../organizations.service';
import { OrganizationsController } from '../organizations.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';

describe('OrganizationsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockPrisma = {
      organization: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
      membership: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [OrganizationsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(OutboxService)
      .useValue(mockOutbox)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide OrganizationsService', () => {
    const service = module.get<OrganizationsService>(OrganizationsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(OrganizationsService);
  });

  it('should provide OrganizationsController', () => {
    const controller = module.get<OrganizationsController>(OrganizationsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(OrganizationsController);
  });

  it('should export OrganizationsService', () => {
    const service = module.get<OrganizationsService>(OrganizationsService);
    expect(service).toBeDefined();
  });
});
