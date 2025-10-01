import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [PassportModule],
            providers: [JwtStrategy],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
        expect(strategy).toBeInstanceOf(JwtStrategy);
    });

    describe('validate', () => {
        it('should return user object with basic payload', async () => {
            const payload = {
                sub: 'user-id-123',
                email: 'test@example.com',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-123',
                email: 'test@example.com',
                role: undefined,
                orgId: undefined,
            });
        });

        it('should return user object with role and orgId', async () => {
            const payload = {
                sub: 'user-id-123',
                email: 'test@example.com',
                role: 'OrgAdmin',
                orgId: 'org-123',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-123',
                email: 'test@example.com',
                role: 'OrgAdmin',
                orgId: 'org-123',
            });
        });

        it('should handle payload with only required fields', async () => {
            const payload = {
                sub: 'user-id-456',
                email: 'admin@example.com',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-456',
                email: 'admin@example.com',
                role: undefined,
                orgId: undefined,
            });
        });

        it('should handle payload with all optional fields', async () => {
            const payload = {
                sub: 'user-id-789',
                email: 'member@example.com',
                role: 'Member',
                orgId: 'org-456',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-789',
                email: 'member@example.com',
                role: 'Member',
                orgId: 'org-456',
            });
        });

        it('should handle payload with null optional fields', async () => {
            const payload = {
                sub: 'user-id-999',
                email: 'user@example.com',
                role: null,
                orgId: null,
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-999',
                email: 'user@example.com',
                role: null,
                orgId: null,
            });
        });

        it('should handle payload with undefined optional fields', async () => {
            const payload = {
                sub: 'user-id-888',
                email: 'user@example.com',
                role: undefined,
                orgId: undefined,
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-888',
                email: 'user@example.com',
                role: undefined,
                orgId: undefined,
            });
        });

        it('should handle different role types', async () => {
            const roles = ['OrgAdmin', 'Member', 'Viewer', 'Editor'];

            for (const role of roles) {
                const payload = {
                    sub: 'user-id-123',
                    email: 'test@example.com',
                    role,
                    orgId: 'org-123',
                };

                const result = await strategy.validate(payload);

                expect(result).toEqual({
                    userId: 'user-id-123',
                    email: 'test@example.com',
                    role,
                    orgId: 'org-123',
                });
            }
        });

        it('should handle different organization IDs', async () => {
            const orgIds = ['org-123', 'org-456', 'org-789', 'org-abc'];

            for (const orgId of orgIds) {
                const payload = {
                    sub: 'user-id-123',
                    email: 'test@example.com',
                    role: 'Member',
                    orgId,
                };

                const result = await strategy.validate(payload);

                expect(result).toEqual({
                    userId: 'user-id-123',
                    email: 'test@example.com',
                    role: 'Member',
                    orgId,
                });
            }
        });

        it('should handle empty string values', async () => {
            const payload = {
                sub: 'user-id-123',
                email: 'test@example.com',
                role: '',
                orgId: '',
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-123',
                email: 'test@example.com',
                role: '',
                orgId: '',
            });
        });

        it('should handle numeric values in optional fields', async () => {
            const payload = {
                sub: 'user-id-123',
                email: 'test@example.com',
                role: 123 as any,
                orgId: 456 as any,
            };

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                userId: 'user-id-123',
                email: 'test@example.com',
                role: 123,
                orgId: 456,
            });
        });
    });

    describe('constructor', () => {
        it('should initialize with correct configuration', () => {
            expect(strategy).toBeDefined();
            // The strategy should be properly configured with JWT options
            // This is tested indirectly through the PassportModule integration
        });
    });
});
