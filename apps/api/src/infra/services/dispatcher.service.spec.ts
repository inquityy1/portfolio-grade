import { Test, TestingModule } from '@nestjs/testing';
import { DispatcherService } from './dispatcher.service';
import { OutboxService } from './outbox.service';

// Mock timers globally
jest.useFakeTimers();

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();

// Mock timer ID that setInterval returns
const mockTimerId = 'mock-timer-id';

// Replace global functions with mocks
global.setInterval = mockSetInterval.mockReturnValue(mockTimerId);
global.clearInterval = mockClearInterval;

describe('DispatcherService', () => {
  let service: DispatcherService;
  let mockOutboxService: jest.Mocked<OutboxService>;

  beforeEach(async () => {
    const mockOutbox = {
      claim: jest.fn(),
      load: jest.fn(),
      markDone: jest.fn(),
      markError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatcherService,
        {
          provide: OutboxService,
          useValue: mockOutbox,
        },
      ],
    }).compile();

    service = module.get<DispatcherService>(DispatcherService);
    mockOutboxService = mockOutbox as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();
    // Reset environment variable to ensure clean state
    delete process.env.OUTBOX_POLL_MS;
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have onModuleInit method', () => {
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('should have onModuleDestroy method', () => {
      expect(typeof service.onModuleDestroy).toBe('function');
    });
  });

  describe('onModuleInit', () => {
    it('should start polling timer', async () => {
      const originalIntervalMs = process.env.OUTBOX_POLL_MS;
      process.env.OUTBOX_POLL_MS = '2000';

      // Create a new service instance after setting the environment variable
      const mockOutbox = {
        claim: jest.fn(),
        load: jest.fn(),
        markDone: jest.fn(),
        markError: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DispatcherService,
          {
            provide: OutboxService,
            useValue: mockOutbox,
          },
        ],
      }).compile();

      const testService = module.get<DispatcherService>(DispatcherService);
      testService.onModuleInit();

      // Verify timer is set by checking if setInterval was called
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 2000);

      process.env.OUTBOX_POLL_MS = originalIntervalMs;
    });

    it('should use default interval when OUTBOX_POLL_MS not set', async () => {
      const originalIntervalMs = process.env.OUTBOX_POLL_MS;
      delete process.env.OUTBOX_POLL_MS;

      // Create a new service instance after deleting the environment variable
      const mockOutbox = {
        claim: jest.fn(),
        load: jest.fn(),
        markDone: jest.fn(),
        markError: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DispatcherService,
          {
            provide: OutboxService,
            useValue: mockOutbox,
          },
        ],
      }).compile();

      const testService = module.get<DispatcherService>(DispatcherService);
      testService.onModuleInit();

      // Verify timer is set with default interval
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        1500, // default interval
      );

      process.env.OUTBOX_POLL_MS = originalIntervalMs;
    });

    it('should set up interval timer', async () => {
      // Ensure environment variable is undefined for default behavior
      delete process.env.OUTBOX_POLL_MS;

      // Create a new service instance after deleting the environment variable
      const mockOutbox = {
        claim: jest.fn(),
        load: jest.fn(),
        markDone: jest.fn(),
        markError: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DispatcherService,
          {
            provide: OutboxService,
            useValue: mockOutbox,
          },
        ],
      }).compile();

      const testService = module.get<DispatcherService>(DispatcherService);
      testService.onModuleInit();

      // Verify timer is set
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        1500, // default interval
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear timer when it exists', () => {
      service.onModuleInit();

      service.onModuleDestroy();

      expect(mockClearInterval).toHaveBeenCalledWith(mockTimerId);
    });

    it('should handle case when timer does not exist', () => {
      // Don't call onModuleInit
      service.onModuleDestroy();

      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });

  describe('tick method', () => {
    it('should process claimed events successfully', async () => {
      const claims = [{ id: 'claim-1' }, { id: 'claim-2' }];

      const event1 = {
        id: 'claim-1',
        topic: 'post.created',
        payload: { id: 'post-123' },
        status: 'processing',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event2 = {
        id: 'claim-2',
        topic: 'user.created',
        payload: { id: 'user-456', name: 'John' },
        status: 'processing',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOutboxService.claim.mockResolvedValue(claims);
      mockOutboxService.load.mockResolvedValueOnce(event1).mockResolvedValueOnce(event2);
      mockOutboxService.markDone.mockResolvedValue(undefined);

      // Manually call tick
      await (service as any).tick();

      expect(mockOutboxService.claim).toHaveBeenCalledWith(25);
      expect(mockOutboxService.load).toHaveBeenCalledWith('claim-1');
      expect(mockOutboxService.load).toHaveBeenCalledWith('claim-2');
      expect(mockOutboxService.markDone).toHaveBeenCalledWith('claim-1');
      expect(mockOutboxService.markDone).toHaveBeenCalledWith('claim-2');
    });

    it('should handle events with no handler', async () => {
      const claims = [{ id: 'claim-unknown' }];
      const event = {
        id: 'claim-unknown',
        topic: 'unknown.topic',
        payload: { data: 'test' },
        status: 'processing',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOutboxService.claim.mockResolvedValue(claims);
      mockOutboxService.load.mockResolvedValue(event);
      mockOutboxService.markDone.mockResolvedValue(undefined);

      await (service as any).tick();

      // Should handle unknown topic gracefully
      expect(mockOutboxService.markDone).toHaveBeenCalledWith('claim-unknown');
    });

    it('should handle handler errors', async () => {
      const claims = [{ id: 'claim-error' }];
      const event = {
        id: 'claim-error',
        topic: 'post.created',
        payload: { id: 'post-error' },
        status: 'processing',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOutboxService.claim.mockResolvedValue(claims);
      mockOutboxService.load.mockResolvedValue(event);
      mockOutboxService.markError.mockResolvedValue(undefined);

      // Mock the handle method to throw an error
      jest.spyOn(service as any, 'handle').mockRejectedValue(new Error('Handler failed'));

      await (service as any).tick();

      // Should handle handler errors gracefully
      expect(mockOutboxService.markError).toHaveBeenCalledWith('claim-error');
    });

    it('should skip events that cannot be loaded', async () => {
      const claims = [{ id: 'claim-missing' }];

      mockOutboxService.claim.mockResolvedValue(claims);
      mockOutboxService.load.mockResolvedValue(null);

      await (service as any).tick();

      expect(mockOutboxService.markDone).not.toHaveBeenCalled();
      expect(mockOutboxService.markError).not.toHaveBeenCalled();
    });

    it('should handle empty claims', async () => {
      mockOutboxService.claim.mockResolvedValue([]);

      await (service as any).tick();

      expect(mockOutboxService.load).not.toHaveBeenCalled();
      expect(mockOutboxService.markDone).not.toHaveBeenCalled();
      expect(mockOutboxService.markError).not.toHaveBeenCalled();
    });

    it('should handle claim errors gracefully', async () => {
      mockOutboxService.claim.mockRejectedValue(new Error('Claim failed'));

      // The tick method should throw when claim fails, but the timer callback catches it
      await expect((service as any).tick()).rejects.toThrow('Claim failed');
    });
  });

  describe('handle method - event handlers', () => {
    it('should handle post.created event', async () => {
      const payload = { id: 'post-123' };

      await (service as any).handle('post.created', payload);

      // Should handle post.created event
    });

    it('should handle post.updated event', async () => {
      const payload = { id: 'post-456' };

      await (service as any).handle('post.updated', payload);

      // Should handle post.updated event
    });

    it('should handle post.deleted event', async () => {
      const payload = { id: 'post-789' };

      await (service as any).handle('post.deleted', payload);

      // Should handle post.deleted event
    });

    it('should handle tag.created event', async () => {
      const payload = { id: 'tag-123', name: 'Technology' };

      await (service as any).handle('tag.created', payload);

      // Should handle tag.created event
    });

    it('should handle tag.updated event', async () => {
      const payload = { id: 'tag-456', name: 'Updated Tag' };

      await (service as any).handle('tag.updated', payload);

      // Should handle tag.updated event
    });

    it('should handle tag.deleted event', async () => {
      const payload = { id: 'tag-789' };

      await (service as any).handle('tag.deleted', payload);

      // Should handle tag.deleted event
    });

    it('should handle user.created event', async () => {
      const payload = { id: 'user-123', name: 'John Doe' };

      await (service as any).handle('user.created', payload);

      // Should handle user.created event
    });

    it('should handle user.updated event', async () => {
      const payload = { id: 'user-456', name: 'Jane Doe' };

      await (service as any).handle('user.updated', payload);

      // Should handle user.updated event
    });

    it('should handle user.deleted event', async () => {
      const payload = { id: 'user-789' };

      await (service as any).handle('user.deleted', payload);

      // Should handle user.deleted event
    });

    it('should handle tags.nightly.stats event', async () => {
      const payload = { orgId: 'org-123' };

      await (service as any).handle('tags.nightly.stats', payload);

      // Should handle tags.nightly.stats event
    });

    it('should handle form.submitted event', async () => {
      const payload = { submissionId: 'sub-123' };

      await (service as any).handle('form.submitted', payload);

      // Should handle form.submitted event
    });

    it('should handle form.updated event', async () => {
      const payload = { id: 'form-456' };

      await (service as any).handle('form.updated', payload);

      // Should handle form.updated event
    });

    it('should handle form.deleted event', async () => {
      const payload = { id: 'form-789' };

      await (service as any).handle('form.deleted', payload);

      // Should handle form.deleted event
    });

    it('should handle form.created event', async () => {
      const payload = { id: 'form-new' };

      await (service as any).handle('form.created', payload);

      // Should handle form.created event
    });

    it('should handle field.created event', async () => {
      const payload = { id: 'field-123', orgId: 'org-456' };

      await (service as any).handle('field.created', payload);

      // Should handle field.created event
    });

    it('should handle field.updated event', async () => {
      const payload = { id: 'field-456', orgId: 'org-789' };

      await (service as any).handle('field.updated', payload);

      // Should handle field.updated event
    });

    it('should handle field.deleted event', async () => {
      const payload = { id: 'field-789', orgId: 'org-123' };

      await (service as any).handle('field.deleted', payload);

      // Should handle field.deleted event
    });

    it('should handle submission.created event', async () => {
      const payload = { id: 'sub-123', formId: 'form-456' };

      await (service as any).handle('submission.created', payload);

      // Should handle submission.created event
    });

    it('should handle comment.created event', async () => {
      const payload = { id: 'comment-123', postId: 'post-456' };

      await (service as any).handle('comment.created', payload);

      // Should handle comment.created event
    });

    it('should handle comment.updated event', async () => {
      const payload = { id: 'comment-456' };

      await (service as any).handle('comment.updated', payload);

      // Should handle comment.updated event
    });

    it('should handle comment.deleted event', async () => {
      const payload = { id: 'comment-789' };

      await (service as any).handle('comment.deleted', payload);

      // Should handle comment.deleted event
    });

    it('should handle comment.restored event', async () => {
      const payload = { id: 'comment-restored' };

      await (service as any).handle('comment.restored', payload);

      // Should handle comment.restored event
    });

    it('should handle unknown topic', async () => {
      const payload = { data: 'test' };

      await (service as any).handle('unknown.topic', payload);

      // Should handle unknown topic gracefully
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow with timer', async () => {
      const claims = [{ id: 'claim-workflow' }];
      const event = {
        id: 'claim-workflow',
        topic: 'post.created',
        payload: { id: 'post-workflow' },
        status: 'processing',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOutboxService.claim.mockResolvedValue(claims);
      mockOutboxService.load.mockResolvedValue(event);
      mockOutboxService.markDone.mockResolvedValue(undefined);

      service.onModuleInit();

      // Get the callback function that was passed to setInterval
      const timerCallback = mockSetInterval.mock.calls[0][0];

      // Execute the callback manually
      await timerCallback();

      expect(mockOutboxService.claim).toHaveBeenCalledWith(25);
      expect(mockOutboxService.load).toHaveBeenCalledWith('claim-workflow');
      expect(mockOutboxService.markDone).toHaveBeenCalledWith('claim-workflow');
    });

    it('should handle multiple timer ticks', async () => {
      mockOutboxService.claim.mockResolvedValue([]);

      service.onModuleInit();

      // Get the callback function that was passed to setInterval
      const timerCallback = mockSetInterval.mock.calls[0][0];

      // Execute the callback multiple times
      await timerCallback();
      await timerCallback();

      expect(mockOutboxService.claim).toHaveBeenCalledTimes(2);
    });
  });
});
