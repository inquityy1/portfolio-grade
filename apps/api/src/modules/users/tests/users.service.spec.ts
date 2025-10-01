import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
    let service: UsersService;
    let mockPrismaService: jest.Mocked<PrismaService>;
    let mockOutboxService: jest.Mocked<OutboxService>;

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
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: OutboxService, useValue: mockOutbox },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        mockPrismaService = module.get(PrismaService);
        mockOutboxService = module.get(OutboxService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAllByOrg', () => {
        it('should return all users in organization', async () => {
            const orgId = 'org-123';
            const expectedUsers = [
                { id: 'user-1', email: 'user1@example.com', name: 'User One', createdAt: new Date() },
                { id: 'user-2', email: 'user2@example.com', name: 'User Two', createdAt: new Date() },
            ];

            (mockPrismaService.user.findMany as jest.Mock).mockResolvedValue(expectedUsers);

            const result = await service.findAllByOrg(orgId);

            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
                where: { memberships: { some: { organizationId: orgId } } },
                select: { id: true, email: true, name: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
            });
            expect(result).toEqual(expectedUsers);
        });

        it('should return empty array when no users exist', async () => {
            const orgId = 'org-123';

            (mockPrismaService.user.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.findAllByOrg(orgId);

            expect(result).toEqual([]);
        });
    });

    describe('findOneInOrg', () => {
        it('should return user when found in organization', async () => {
            const userId = 'user-123';
            const orgId = 'org-123';
            const expectedUser = { id: userId, email: 'user@example.com', name: 'John Doe', createdAt: new Date() };

            (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(expectedUser);

            const result = await service.findOneInOrg(userId, orgId);

            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
                where: {
                    id: userId,
                    memberships: { some: { organizationId: orgId } },
                },
                select: { id: true, email: true, name: true, createdAt: true },
            });
            expect(result).toEqual(expectedUser);
        });

        it('should throw NotFoundException when user not found in organization', async () => {
            const userId = 'user-123';
            const orgId = 'org-123';

            (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.findOneInOrg(userId, orgId)).rejects.toThrow(
                new NotFoundException('User not found in this organization')
            );
        });
    });

    describe('findByEmail', () => {
        it('should return user when found by email', async () => {
            const email = 'user@example.com';
            const expectedUser = { id: 'user-123', email, name: 'John Doe', createdAt: new Date() };

            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(expectedUser);

            const result = await service.findByEmail(email);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(result).toEqual(expectedUser);
        });

        it('should return null when user not found', async () => {
            const email = 'nonexistent@example.com';

            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.findByEmail(email);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create user and publish event', async () => {
            const userData = { email: 'user@example.com', password: 'password123', name: 'John Doe' };
            const expectedUser = { id: 'user-123', ...userData, createdAt: new Date() };

            (mockPrismaService.user.create as jest.Mock).mockResolvedValue(expectedUser);

            const result = await service.create(userData);

            expect(mockPrismaService.user.create).toHaveBeenCalledWith({ data: userData });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('user.created', {
                id: expectedUser.id,
                name: userData.name,
            });
            expect(result).toEqual(expectedUser);
        });
    });

    describe('createUserWithMembership', () => {
        it('should create user with membership successfully', async () => {
            const orgId = 'org-123';
            const userData = {
                email: 'user@example.com',
                password: 'password123',
                name: 'John Doe',
                role: 'Editor' as any,
            };
            const hashedPassword = 'hashed-password';
            const expectedUser = {
                id: 'user-123',
                email: userData.email,
                name: userData.name,
                role: userData.role,
                createdAt: expect.any(Date),
            };

            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

            const mockTx = {
                user: {
                    create: jest.fn().mockResolvedValue({
                        id: 'user-123',
                        email: userData.email,
                        password: hashedPassword,
                        name: userData.name,
                        createdAt: new Date(),
                    }),
                },
                membership: {
                    create: jest.fn().mockResolvedValue({}),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            const result = await service.createUserWithMembership(orgId, userData);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(mockTx.user.create).toHaveBeenCalledWith({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    name: userData.name,
                },
            });
            expect(mockTx.membership.create).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId: 'user-123',
                    role: userData.role,
                },
            });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('user.created', {
                id: 'user-123',
                name: userData.name,
            });
            expect(result).toEqual(expectedUser);
        });

        it('should create user with custom organizationId', async () => {
            const orgId = 'org-123';
            const customOrgId = 'org-456';
            const userData = {
                email: 'user@example.com',
                password: 'password123',
                name: 'John Doe',
                role: 'Editor' as any,
                organizationId: customOrgId,
            };
            const hashedPassword = 'hashed-password';

            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

            const mockTx = {
                user: {
                    create: jest.fn().mockResolvedValue({
                        id: 'user-123',
                        email: userData.email,
                        password: hashedPassword,
                        name: userData.name,
                        createdAt: new Date(),
                    }),
                },
                membership: {
                    create: jest.fn().mockResolvedValue({}),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            await service.createUserWithMembership(orgId, userData);

            expect(mockTx.membership.create).toHaveBeenCalledWith({
                data: {
                    organizationId: customOrgId,
                    userId: 'user-123',
                    role: userData.role,
                },
            });
        });

        it('should throw ConflictException when email already exists', async () => {
            const orgId = 'org-123';
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'John Doe',
                role: 'Editor' as any,
            };
            const existingUser = { id: 'user-456', email: userData.email };

            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

            await expect(service.createUserWithMembership(orgId, userData)).rejects.toThrow(
                new ConflictException('User with this email already exists')
            );

            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            const userId = 'user-123';
            const orgId = 'org-123';
            const updateData = { name: 'Updated Name', email: 'updated@example.com' };
            const existingUser = { id: userId, email: 'old@example.com', name: 'Old Name' };
            const updatedUser = { id: userId, ...updateData, updatedAt: new Date() };

            (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(existingUser);
            (mockPrismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

            const result = await service.update(userId, orgId, updateData);

            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
                where: {
                    id: userId,
                    memberships: { some: { organizationId: orgId } },
                },
            });
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: updateData,
            });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('user.updated', {
                id: userId,
                name: updateData.name,
            });
            expect(result).toEqual(updatedUser);
        });

        it('should throw NotFoundException when user not found in organization', async () => {
            const userId = 'user-123';
            const orgId = 'org-123';
            const updateData = { name: 'Updated Name' };

            (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.update(userId, orgId, updateData)).rejects.toThrow(
                new NotFoundException('User not found in this organization')
            );

            expect(mockPrismaService.user.update).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should remove user successfully', async () => {
            const userId = 'user-123';
            const deletedUser = { id: userId, email: 'user@example.com', name: 'John Doe' };

            (mockPrismaService.user.delete as jest.Mock).mockResolvedValue(deletedUser);

            const result = await service.remove(userId);

            expect(mockOutboxService.publish).toHaveBeenCalledWith('user.deleted', { id: userId });
            expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
            expect(result).toEqual(deletedUser);
        });
    });
});
