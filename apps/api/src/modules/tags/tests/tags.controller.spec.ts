import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from '../tags.controller';
import { TagsService } from '../tags.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('TagsController', () => {
  let controller: TagsController;
  let mockTagsService: jest.Mocked<TagsService>;

  beforeEach(async () => {
    const mockPrisma = {
      tag: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        TagsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: mockOutbox },
        { provide: RolesGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: Reflector, useValue: { get: jest.fn() } },
        {
          provide: RateLimitService,
          useValue: {
            hit: jest
              .fn()
              .mockResolvedValue({ allowed: true, remaining: 10, limit: 10, resetSeconds: 60 }),
          },
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
    mockTagsService = module.get(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all tags for organization', async () => {
      const orgId = 'org-123';
      const expectedTags = [
        { id: 'tag-1', name: 'javascript' },
        { id: 'tag-2', name: 'typescript' },
        { id: 'tag-3', name: 'react' },
      ];

      jest.spyOn(mockTagsService, 'list').mockResolvedValue(expectedTags);

      const result = await controller.list(orgId);

      expect(mockTagsService.list).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(expectedTags);
    });

    it('should return empty array when no tags exist', async () => {
      const orgId = 'org-123';

      jest.spyOn(mockTagsService, 'list').mockResolvedValue([]);

      const result = await controller.list(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagName = 'javascript';
      const expectedTag = { id: 'tag-123', name: tagName };
      const req = { user: { userId } };
      const body = { name: tagName };

      jest.spyOn(mockTagsService, 'create').mockResolvedValue(expectedTag);

      const result = await controller.create(orgId, req, body);

      expect(mockTagsService.create).toHaveBeenCalledWith(orgId, userId, tagName);
      expect(result).toEqual(expectedTag);
    });

    it('should trim tag name before creating', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagName = '  javascript  ';
      const trimmedName = 'javascript';
      const expectedTag = { id: 'tag-123', name: trimmedName };
      const req = { user: { userId } };
      const body = { name: tagName };

      jest.spyOn(mockTagsService, 'create').mockResolvedValue(expectedTag);

      const result = await controller.create(orgId, req, body);

      expect(mockTagsService.create).toHaveBeenCalledWith(orgId, userId, trimmedName);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('update', () => {
    it('should update an existing tag', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagId = 'tag-123';
      const tagName = 'typescript';
      const expectedTag = { id: tagId, name: tagName };
      const req = { user: { userId } };
      const body = { name: tagName };

      jest.spyOn(mockTagsService, 'update').mockResolvedValue(expectedTag);

      const result = await controller.update(orgId, req, tagId, body);

      expect(mockTagsService.update).toHaveBeenCalledWith(orgId, userId, tagId, { name: tagName });
      expect(result).toEqual(expectedTag);
    });

    it('should trim tag name before updating', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagId = 'tag-123';
      const tagName = '  typescript  ';
      const trimmedName = 'typescript';
      const expectedTag = { id: tagId, name: trimmedName };
      const req = { user: { userId } };
      const body = { name: tagName };

      jest.spyOn(mockTagsService, 'update').mockResolvedValue(expectedTag);

      const result = await controller.update(orgId, req, tagId, body);

      expect(mockTagsService.update).toHaveBeenCalledWith(orgId, userId, tagId, {
        name: trimmedName,
      });
      expect(result).toEqual(expectedTag);
    });

    it('should handle undefined name in update', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagId = 'tag-123';
      const expectedTag = { id: tagId, name: 'javascript' };
      const req = { user: { userId } };
      const body = { name: undefined };

      jest.spyOn(mockTagsService, 'update').mockResolvedValue(expectedTag);

      const result = await controller.update(orgId, req, tagId, body);

      expect(mockTagsService.update).toHaveBeenCalledWith(orgId, userId, tagId, {
        name: undefined,
      });
      expect(result).toEqual(expectedTag);
    });
  });

  describe('remove', () => {
    it('should remove an existing tag', async () => {
      const orgId = 'org-123';
      const userId = 'user-123';
      const tagId = 'tag-123';
      const expectedResult = { ok: true };
      const req = { user: { userId } };

      jest.spyOn(mockTagsService, 'remove').mockResolvedValue(expectedResult);

      const result = await controller.remove(orgId, req, tagId);

      expect(mockTagsService.remove).toHaveBeenCalledWith(orgId, userId, tagId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('controller metadata', () => {
    it('should have controller methods defined', () => {
      expect(typeof controller.list).toBe('function');
      expect(typeof controller.create).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.remove).toBe('function');
    });
  });
});
