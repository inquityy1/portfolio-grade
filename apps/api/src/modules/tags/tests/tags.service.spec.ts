import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from '../tags.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { OutboxService } from '../../../infra/services/outbox.service';

describe('TagsService', () => {
    let service: TagsService;
    let mockPrismaService: jest.Mocked<PrismaService>;
    let mockOutboxService: jest.Mocked<OutboxService>;

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
            providers: [
                TagsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: OutboxService, useValue: mockOutbox },
            ],
        }).compile();

        service = module.get<TagsService>(TagsService);
        mockPrismaService = module.get(PrismaService);
        mockOutboxService = module.get(OutboxService);
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

            (mockPrismaService.tag.findMany as jest.Mock).mockResolvedValue(expectedTags);

            const result = await service.list(orgId);

            expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
                where: { organizationId: orgId },
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            });
            expect(result).toEqual(expectedTags);
        });

        it('should return empty array when no tags exist', async () => {
            const orgId = 'org-123';

            (mockPrismaService.tag.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.list(orgId);

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should create a new tag successfully', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagName = 'javascript';
            const expectedTag = { id: 'tag-123', name: tagName };

            const mockTx = {
                tag: {
                    create: jest.fn().mockResolvedValue(expectedTag),
                },
                auditLog: {
                    create: jest.fn().mockResolvedValue({}),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            const result = await service.create(orgId, userId, tagName);

            expect(mockTx.tag.create).toHaveBeenCalledWith({
                data: { organizationId: orgId, name: tagName },
                select: { id: true, name: true },
            });
            expect(mockTx.auditLog.create).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'TAG_CREATED',
                    resource: 'Tag',
                    resourceId: expectedTag.id,
                },
            });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('tag.created', {
                id: expectedTag.id,
                orgId,
            });
            expect(result).toEqual(expectedTag);
        });

        it('should throw ConflictException when tag name already exists', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagName = 'javascript';

            const mockTx = {
                tag: {
                    create: jest.fn().mockRejectedValue({ code: 'P2002' }),
                },
                auditLog: {
                    create: jest.fn(),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            await expect(service.create(orgId, userId, tagName)).rejects.toThrow(
                new ConflictException('Tag name already exists in this org')
            );
        });

        it('should rethrow other database errors', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagName = 'javascript';
            const dbError = new Error('Database connection failed');

            const mockTx = {
                tag: {
                    create: jest.fn().mockRejectedValue(dbError),
                },
                auditLog: {
                    create: jest.fn(),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            await expect(service.create(orgId, userId, tagName)).rejects.toThrow(dbError);
        });
    });

    describe('update', () => {
        it('should update tag successfully', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';
            const updateData = { name: 'typescript' };
            const expectedTag = { id: tagId, name: 'typescript' };

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

            const mockTx = {
                tag: {
                    update: jest.fn().mockResolvedValue(expectedTag),
                },
                auditLog: {
                    create: jest.fn().mockResolvedValue({}),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            const result = await service.update(orgId, userId, tagId, updateData);

            expect(mockPrismaService.tag.findFirst).toHaveBeenCalledWith({
                where: { id: tagId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockTx.tag.update).toHaveBeenCalledWith({
                where: { id: tagId },
                data: updateData,
                select: { id: true, name: true },
            });
            expect(mockTx.auditLog.create).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'TAG_UPDATED',
                    resource: 'Tag',
                    resourceId: tagId,
                },
            });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('tag.updated', {
                id: tagId,
                orgId,
            });
            expect(result).toEqual(expectedTag);
        });

        it('should throw NotFoundException when tag does not exist', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';
            const updateData = { name: 'typescript' };

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.update(orgId, userId, tagId, updateData)).rejects.toThrow(
                new NotFoundException('Tag not found')
            );

            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });

        it('should throw ConflictException when new name already exists', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';
            const updateData = { name: 'typescript' };

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

            const mockTx = {
                tag: {
                    update: jest.fn().mockRejectedValue({ code: 'P2002' }),
                },
                auditLog: {
                    create: jest.fn(),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            await expect(service.update(orgId, userId, tagId, updateData)).rejects.toThrow(
                new ConflictException('Tag name already exists in this org')
            );
        });

        it('should rethrow other database errors', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';
            const updateData = { name: 'typescript' };
            const dbError = new Error('Database connection failed');

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

            const mockTx = {
                tag: {
                    update: jest.fn().mockRejectedValue(dbError),
                },
                auditLog: {
                    create: jest.fn(),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            await expect(service.update(orgId, userId, tagId, updateData)).rejects.toThrow(dbError);
        });
    });

    describe('remove', () => {
        it('should remove tag successfully', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

            const mockTx = {
                tag: {
                    delete: jest.fn().mockResolvedValue({}),
                },
                auditLog: {
                    create: jest.fn().mockResolvedValue({}),
                },
            };

            (mockPrismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return await callback(mockTx);
            });

            const result = await service.remove(orgId, userId, tagId);

            expect(mockPrismaService.tag.findFirst).toHaveBeenCalledWith({
                where: { id: tagId, organizationId: orgId },
                select: { id: true },
            });
            expect(mockTx.tag.delete).toHaveBeenCalledWith({ where: { id: tagId } });
            expect(mockTx.auditLog.create).toHaveBeenCalledWith({
                data: {
                    organizationId: orgId,
                    userId,
                    action: 'TAG_DELETED',
                    resource: 'Tag',
                    resourceId: tagId,
                },
            });
            expect(mockOutboxService.publish).toHaveBeenCalledWith('tag.deleted', {
                id: tagId,
                orgId,
            });
            expect(result).toEqual({ ok: true });
        });

        it('should throw NotFoundException when tag does not exist', async () => {
            const orgId = 'org-123';
            const userId = 'user-123';
            const tagId = 'tag-123';

            (mockPrismaService.tag.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(orgId, userId, tagId)).rejects.toThrow(
                new NotFoundException('Tag not found')
            );

            expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
        });
    });
});
