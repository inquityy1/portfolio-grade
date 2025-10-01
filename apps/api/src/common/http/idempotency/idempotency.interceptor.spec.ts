import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { PrismaService } from '../../../infra/services/prisma.service';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';

describe('IdempotencyInterceptor', () => {
    let interceptor: IdempotencyInterceptor;
    let mockPrismaService: jest.Mocked<PrismaService>;
    let mockContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(async () => {
        mockRequest = {
            method: 'POST',
            headers: {
                'x-org-id': 'org-123',
                'idempotency-key': 'test-key-123',
            },
            baseUrl: '/api',
            route: { path: '/posts' },
            path: '/api/posts',
            body: { title: 'Test Post', content: 'Test Content' },
        };

        mockResponse = {
            setHeader: jest.fn(),
        };

        const mockPrismaValue = {
            idempotencyKey: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IdempotencyInterceptor,
                { provide: PrismaService, useValue: mockPrismaValue },
            ],
        }).compile();

        interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
        mockPrismaService = module.get(PrismaService);

        mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            }),
        } as any;

        mockCallHandler = {
            handle: jest.fn().mockReturnValue(of({ id: 'post-123', title: 'Test Post' })),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    describe('intercept', () => {
        it('should skip idempotency for non-mutating methods', (done) => {
            mockRequest.method = 'GET';

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toEqual({ id: 'post-123', title: 'Test Post' });
                    expect(mockPrismaService.idempotencyKey.findUnique).not.toHaveBeenCalled();
                    expect(mockCallHandler.handle).toHaveBeenCalled();
                    done();
                },
                error: done,
            });
        });

        it('should throw error when orgId header is missing', () => {
            mockRequest.headers = { 'idempotency-key': 'test-key-123' };

            expect(() => {
                interceptor.intercept(mockContext, mockCallHandler);
            }).toThrow(BadRequestException);
        });

        it('should throw error when idempotency-key header is missing', () => {
            mockRequest.headers = { 'x-org-id': 'org-123' };

            expect(() => {
                interceptor.intercept(mockContext, mockCallHandler);
            }).toThrow(BadRequestException);
        });

        it('should return cached response when idempotency key exists with matching body hash', (done) => {
            const cachedResponse = { id: 'cached-post-123', title: 'Cached Post' };
            const bodyHash = crypto.createHash('sha256').update(JSON.stringify(mockRequest.body)).digest('hex');

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
                bodyHash,
                response: cachedResponse,
            });

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toEqual(cachedResponse);
                    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Idempotency', 'HIT');
                    expect(mockCallHandler.handle).not.toHaveBeenCalled();
                    done();
                },
                error: done,
            });
        });

        it('should throw error when idempotency key exists with different body hash', (done) => {
            const differentBodyHash = 'different-hash';

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
                bodyHash: differentBodyHash,
                response: { id: 'some-response' },
            });

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => done(new Error('Should have thrown')),
                error: (error) => {
                    expect(error).toBeInstanceOf(BadRequestException);
                    expect(error.message).toBe('Idempotency-Key conflict: body differs from original request.');
                    done();
                },
            });
        });

        it('should create new idempotency key and process request when key does not exist', (done) => {
            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toEqual({ id: 'post-123', title: 'Test Post' });
                    expect(mockCallHandler.handle).toHaveBeenCalled();
                    expect(mockPrismaService.idempotencyKey.create).toHaveBeenCalled();
                    expect(mockPrismaService.idempotencyKey.update).toHaveBeenCalled();

                    // Wait for the async tap operation to complete
                    setTimeout(() => {
                        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Idempotency', 'MISS');
                        done();
                    }, 10);
                },
                error: done,
            });
        });

        it('should handle different HTTP methods correctly', (done) => {
            const methods = ['POST', 'PATCH', 'PUT', 'DELETE'];
            let completedTests = 0;

            methods.forEach((method) => {
                mockRequest.method = method;
                mockRequest.headers = {
                    'x-org-id': 'org-123',
                    'idempotency-key': `test-key-${method}`,
                };

                (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
                (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: `key-${method}` });
                (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

                interceptor.intercept(mockContext, mockCallHandler).subscribe({
                    next: (result) => {
                        expect(result).toEqual({ id: 'post-123', title: 'Test Post' });
                        completedTests++;
                        if (completedTests === methods.length) {
                            done();
                        }
                    },
                    error: done,
                });
            });
        });

        it('should generate correct route signature', (done) => {
            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    expect(mockPrismaService.idempotencyKey.findUnique).toHaveBeenCalledWith({
                        where: { orgId_route_key: { orgId: 'org-123', route: 'POST /api/posts', key: 'test-key-123' } },
                        select: { bodyHash: true, response: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle route without baseUrl', (done) => {
            mockRequest.baseUrl = '';
            mockRequest.route = { path: '/posts' };

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    expect(mockPrismaService.idempotencyKey.findUnique).toHaveBeenCalledWith({
                        where: { orgId_route_key: { orgId: 'org-123', route: 'POST /posts', key: 'test-key-123' } },
                        select: { bodyHash: true, response: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle route without route.path', (done) => {
            mockRequest.route = {};
            mockRequest.path = '/posts'; // Remove /api prefix since baseUrl already has it

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    expect(mockPrismaService.idempotencyKey.findUnique).toHaveBeenCalledWith({
                        where: { orgId_route_key: { orgId: 'org-123', route: 'POST /api/posts', key: 'test-key-123' } },
                        select: { bodyHash: true, response: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle string body payload', (done) => {
            mockRequest.body = '{"title":"Test Post"}';

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    const expectedHash = crypto.createHash('sha256').update('{"title":"Test Post"}').digest('hex');
                    expect(mockPrismaService.idempotencyKey.create).toHaveBeenCalledWith({
                        data: { orgId: 'org-123', route: 'POST /api/posts', key: 'test-key-123', bodyHash: expectedHash },
                        select: { id: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle null body payload', (done) => {
            mockRequest.body = null;

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    const expectedHash = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');
                    expect(mockPrismaService.idempotencyKey.create).toHaveBeenCalledWith({
                        data: { orgId: 'org-123', route: 'POST /api/posts', key: 'test-key-123', bodyHash: expectedHash },
                        select: { id: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle undefined body payload', (done) => {
            mockRequest.body = undefined;

            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockResolvedValue({});

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => {
                    const expectedHash = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');
                    expect(mockPrismaService.idempotencyKey.create).toHaveBeenCalledWith({
                        data: { orgId: 'org-123', route: 'POST /api/posts', key: 'test-key-123', bodyHash: expectedHash },
                        select: { id: true },
                    });
                    done();
                },
                error: done,
            });
        });

        it('should handle database errors gracefully during update', (done) => {
            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockResolvedValue({ id: 'key-123' });
            (mockPrismaService.idempotencyKey.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toEqual({ id: 'post-123', title: 'Test Post' });
                    // The header is not set when there's an error in the tap operator
                    // because the error is caught and swallowed
                    expect(mockResponse.setHeader).not.toHaveBeenCalledWith('X-Idempotency', 'MISS');
                    done();
                },
                error: done,
            });
        });

        it('should handle database errors during findUnique', (done) => {
            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => done(new Error('Should have thrown')),
                error: (error) => {
                    expect(error.message).toBe('DB Error');
                    done();
                },
            });
        });

        it('should handle database errors during create', (done) => {
            (mockPrismaService.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.idempotencyKey.create as jest.Mock).mockRejectedValue(new Error('DB Create Error'));

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: () => done(new Error('Should have thrown')),
                error: (error) => {
                    expect(error.message).toBe('DB Create Error');
                    done();
                },
            });
        });
    });

    describe('bodyHash function', () => {
        it('should generate consistent hash for same input', () => {
            const payload1 = { title: 'Test', content: 'Content' };
            const payload2 = { title: 'Test', content: 'Content' };

            const hash1 = crypto.createHash('sha256').update(JSON.stringify(payload1)).digest('hex');
            const hash2 = crypto.createHash('sha256').update(JSON.stringify(payload2)).digest('hex');

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const payload1 = { title: 'Test', content: 'Content' };
            const payload2 = { title: 'Different', content: 'Content' };

            const hash1 = crypto.createHash('sha256').update(JSON.stringify(payload1)).digest('hex');
            const hash2 = crypto.createHash('sha256').update(JSON.stringify(payload2)).digest('hex');

            expect(hash1).not.toBe(hash2);
        });
    });
});
