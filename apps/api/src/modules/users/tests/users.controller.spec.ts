import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../../infra/services/rate-limit.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      membership: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockOutbox = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
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

    controller = module.get<UsersController>(UsersController);
    mockUsersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all users in organization', async () => {
      const orgId = 'org-123';
      const expectedUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User One', createdAt: new Date() },
        { id: 'user-2', email: 'user2@example.com', name: 'User Two', createdAt: new Date() },
      ];

      jest.spyOn(mockUsersService, 'findAllByOrg').mockResolvedValue(expectedUsers);

      const result = await controller.getAll(orgId);

      expect(mockUsersService.findAllByOrg).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(expectedUsers);
    });

    it('should return empty array when no users exist', async () => {
      const orgId = 'org-123';

      jest.spyOn(mockUsersService, 'findAllByOrg').mockResolvedValue([]);

      const result = await controller.getAll(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new user with membership', async () => {
      const orgId = 'org-123';
      const createDto = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'Editor' as any,
      };
      const expectedUser = {
        id: 'user-123',
        email: createDto.email,
        name: createDto.name,
        role: createDto.role as any,
        createdAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'createUserWithMembership').mockResolvedValue(expectedUser);

      const result = await controller.create(orgId, createDto);

      expect(mockUsersService.createUserWithMembership).toHaveBeenCalledWith(orgId, createDto);
      expect(result).toEqual(expectedUser);
    });

    it('should create user with custom organizationId', async () => {
      const orgId = 'org-123';
      const createDto = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'Editor' as any,
        organizationId: 'org-456',
      };
      const expectedUser = {
        id: 'user-123',
        email: createDto.email,
        name: createDto.name,
        role: createDto.role as any,
        createdAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'createUserWithMembership').mockResolvedValue(expectedUser);

      const result = await controller.create(orgId, createDto);

      expect(mockUsersService.createUserWithMembership).toHaveBeenCalledWith(orgId, createDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getOne', () => {
    it('should return user by ID', async () => {
      const userId = 'user-123';
      const orgId = 'org-123';
      const expectedUser = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'findOneInOrg').mockResolvedValue(expectedUser);

      const result = await controller.getOne(userId, orgId);

      expect(mockUsersService.findOneInOrg).toHaveBeenCalledWith(userId, orgId);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123';
      const orgId = 'org-123';
      const updateDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };
      const expectedUser = {
        id: userId,
        email: updateDto.email,
        name: updateDto.name,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'update').mockResolvedValue(expectedUser);

      const result = await controller.update(userId, orgId, updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(userId, orgId, updateDto);
      expect(result).toEqual(expectedUser);
    });

    it('should update user with partial data', async () => {
      const userId = 'user-123';
      const orgId = 'org-123';
      const updateDto = {
        name: 'Updated Name Only',
      };
      const expectedUser = {
        id: userId,
        email: 'user@example.com',
        name: updateDto.name,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'update').mockResolvedValue(expectedUser);

      const result = await controller.update(userId, orgId, updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(userId, orgId, updateDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const userId = 'user-123';
      const expectedUser = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(mockUsersService, 'remove').mockResolvedValue(expectedUser);

      const result = await controller.remove(userId);

      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('controller metadata', () => {
    it('should have controller methods defined', () => {
      expect(typeof controller.getAll).toBe('function');
      expect(typeof controller.create).toBe('function');
      expect(typeof controller.getOne).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.remove).toBe('function');
    });
  });
});
