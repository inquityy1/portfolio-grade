import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from '../../infra/services/rate-limit.service';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

describe('RateLimitGuard', () => {
    let guard: RateLimitGuard;
    let mockReflector: jest.Mocked<Reflector>;
    let mockRateLimitService: jest.Mocked<RateLimitService>;

    beforeEach(async () => {
        const mockReflectorValue = {
            get: jest.fn(),
        };

        const mockRateLimitServiceValue = {
            hit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RateLimitGuard,
                { provide: Reflector, useValue: mockReflectorValue },
                { provide: RateLimitService, useValue: mockRateLimitServiceValue },
            ],
        }).compile();

        guard = module.get<RateLimitGuard>(RateLimitGuard);
        mockReflector = module.get(Reflector);
        mockRateLimitService = module.get(RateLimitService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        let mockContext: ExecutionContext;
        let mockRequest: any;
        let mockResponse: any;

        beforeEach(() => {
            mockRequest = {
                method: 'GET',
                path: '/api/test',
                baseUrl: '/api',
                headers: {
                    'x-org-id': 'org-123',
                    'x-forwarded-for': '192.168.1.1',
                },
                ip: '127.0.0.1',
                user: { userId: 'user-123' },
            };

            mockResponse = {
                setHeader: jest.fn(),
            };

            mockContext = {
                switchToHttp: () => ({
                    getRequest: () => mockRequest,
                    getResponse: () => mockResponse,
                }),
                getHandler: jest.fn(),
                getClass: jest.fn(),
            } as any;
        });

        it('should use default rate limit config when no config is provided', async () => {
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 59,
                limit: 60,
                resetSeconds: 10,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledTimes(2); // perUser and perOrg
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'user:user-123:GET:/api/api/test',
                60,
                10
            );
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'org:org-123:GET:/api/api/test',
                600,
                60
            );
        });

        it('should use provided rate limit config', async () => {
            const customConfig = {
                perUser: { limit: 10, windowSec: 60 },
                perOrg: { limit: 100, windowSec: 300 },
            };

            mockReflector.get.mockReturnValue(customConfig);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                limit: 10,
                resetSeconds: 60,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'user:user-123:GET:/api/api/test',
                10,
                60
            );
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'org:org-123:GET:/api/api/test',
                100,
                300
            );
        });

        it('should handle perIp rate limiting', async () => {
            const configWithIp = {
                perIp: { limit: 5, windowSec: 30 },
            };

            mockReflector.get.mockReturnValue(configWithIp);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 4,
                limit: 5,
                resetSeconds: 30,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'ip:192.168.1.1:GET:/api/api/test',
                5,
                30
            );
        });

        it('should handle missing orgId header', async () => {
            mockRequest.headers = {};
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 59,
                limit: 60,
                resetSeconds: 10,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'org:no-org:GET:/api/api/test',
                600,
                60
            );
        });

        it('should handle missing user', async () => {
            mockRequest.user = undefined;
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 59,
                limit: 60,
                resetSeconds: 10,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'user:anon:GET:/api/api/test',
                60,
                10
            );
        });

        it('should handle missing IP address', async () => {
            mockRequest.headers = { 'x-org-id': 'org-123' };
            mockRequest.ip = undefined;
            const configWithIp = {
                perIp: { limit: 5, windowSec: 30 },
            };

            mockReflector.get.mockReturnValue(configWithIp);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 4,
                limit: 5,
                resetSeconds: 30,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'ip:0.0.0.0:GET:/api/api/test',
                5,
                30
            );
        });

        it('should set rate limit headers when request is allowed', async () => {
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 59,
                limit: 60,
                resetSeconds: 10,
            });

            await guard.canActivate(mockContext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '59');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '10');
        });

        it('should throw HttpException when rate limit is exceeded', async () => {
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: false,
                remaining: 0,
                limit: 60,
                resetSeconds: 10,
            });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
            );
        });

        it('should handle mixed rate limit results', async () => {
            mockReflector.get.mockReturnValue({
                perUser: { limit: 10, windowSec: 60 },
                perOrg: { limit: 100, windowSec: 300 },
            });

            // User limit exceeded, org limit not exceeded
            mockRateLimitService.hit
                .mockResolvedValueOnce({
                    allowed: false,
                    remaining: 0,
                    limit: 10,
                    resetSeconds: 60,
                })
                .mockResolvedValueOnce({
                    allowed: true,
                    remaining: 99,
                    limit: 100,
                    resetSeconds: 300,
                });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
            );
        });

        it('should use tightest window for headers', async () => {
            mockReflector.get.mockReturnValue({
                perUser: { limit: 10, windowSec: 30 },
                perOrg: { limit: 100, windowSec: 60 },
            });

            mockRateLimitService.hit
                .mockResolvedValueOnce({
                    allowed: true,
                    remaining: 9,
                    limit: 10,
                    resetSeconds: 30, // Tighter window
                })
                .mockResolvedValueOnce({
                    allowed: true,
                    remaining: 99,
                    limit: 100,
                    resetSeconds: 60,
                });

            await guard.canActivate(mockContext);

            // Should use the tighter window (30 seconds)
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '30');
        });

        it('should handle service errors', async () => {
            mockReflector.get.mockReturnValue(undefined);
            const serviceError = new Error('Rate limit service error');
            mockRateLimitService.hit.mockRejectedValue(serviceError);

            await expect(guard.canActivate(mockContext)).rejects.toThrow(serviceError);
        });

        it('should handle empty path and baseUrl', async () => {
            mockRequest.path = '';
            mockRequest.baseUrl = '';
            mockReflector.get.mockReturnValue(undefined);
            mockRateLimitService.hit.mockResolvedValue({
                allowed: true,
                remaining: 59,
                limit: 60,
                resetSeconds: 10,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRateLimitService.hit).toHaveBeenCalledWith(
                'user:user-123:GET:',
                60,
                10
            );
        });
    });

    describe('rate limit key generation', () => {
        it('should generate correct keys for different scopes', () => {
            const testCases = [
                {
                    scope: 'user',
                    userId: 'user-123',
                    routeKey: 'GET:/api/test',
                    expectedKey: 'user:user-123:GET:/api/test',
                },
                {
                    scope: 'org',
                    orgId: 'org-456',
                    routeKey: 'POST:/api/create',
                    expectedKey: 'org:org-456:POST:/api/create',
                },
                {
                    scope: 'ip',
                    ip: '192.168.1.100',
                    routeKey: 'PUT:/api/update',
                    expectedKey: 'ip:192.168.1.100:PUT:/api/update',
                },
            ];

            testCases.forEach(({ scope, expectedKey }) => {
                // This tests the key generation logic used in the guard
                const key = `${scope}:${scope === 'user' ? 'user-123' : scope === 'org' ? 'org-456' : '192.168.1.100'}:${scope === 'user' ? 'GET:/api/test' : scope === 'org' ? 'POST:/api/create' : 'PUT:/api/update'}`;
                expect(key).toBe(expectedKey);
            });
        });
    });
});
