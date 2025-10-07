import { Test, TestingModule } from '@nestjs/testing';
import { FormsModule } from '../forms.module';
import { FormsService } from '../forms.service';
import { FormsController } from '../forms.controller';
import { FormsPublicController } from '../forms.public.controller';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';

describe('FormsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockPrisma = {
      form: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [FormsModule],
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

  it('should provide FormsService', () => {
    const service = module.get<FormsService>(FormsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(FormsService);
  });

  it('should provide FormsController', () => {
    const controller = module.get<FormsController>(FormsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(FormsController);
  });

  it('should provide FormsPublicController', () => {
    const controller = module.get<FormsPublicController>(FormsPublicController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(FormsPublicController);
  });

  it('should export FormsService', () => {
    const service = module.get<FormsService>(FormsService);
    expect(service).toBeDefined();
  });
});
