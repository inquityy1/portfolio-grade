import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;

    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
        me: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const expectedUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                name: 'Test User',
                createdAt: new Date(),
            };

            mockAuthService.register.mockResolvedValue(expectedUser);

            const result = await controller.register(registerDto);

            expect(authService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(expectedUser);
        });

        it('should handle registration errors', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const error = new Error('Registration failed');
            mockAuthService.register.mockRejectedValue(error);

            await expect(controller.register(registerDto)).rejects.toThrow(error);
            expect(authService.register).toHaveBeenCalledWith(registerDto);
        });

        it('should handle email already exists error', async () => {
            const registerDto: RegisterDto = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const error = new Error('User with this email already exists');
            mockAuthService.register.mockRejectedValue(error);

            await expect(controller.register(registerDto)).rejects.toThrow(error);
            expect(authService.register).toHaveBeenCalledWith(registerDto);
        });

        it('should handle validation errors', async () => {
            const registerDto: RegisterDto = {
                email: 'invalid-email',
                password: '123', // Too short
                name: '', // Empty name
            };

            const error = new Error('Validation failed');
            mockAuthService.register.mockRejectedValue(error);

            await expect(controller.register(registerDto)).rejects.toThrow(error);
            expect(authService.register).toHaveBeenCalledWith(registerDto);
        });
    });

    describe('login', () => {
        it('should login user successfully', async () => {
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            const expectedResponse = {
                access_token: 'jwt-token-123',
            };

            mockAuthService.login.mockResolvedValue(expectedResponse);

            const result = await controller.login(loginDto);

            expect(authService.login).toHaveBeenCalledWith(loginDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should handle invalid credentials error', async () => {
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            const error = new UnauthorizedException('Invalid credentials');
            mockAuthService.login.mockRejectedValue(error);

            await expect(controller.login(loginDto)).rejects.toThrow(error);
            expect(authService.login).toHaveBeenCalledWith(loginDto);
        });

        it('should handle user not found error', async () => {
            const loginDto: LoginDto = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const error = new UnauthorizedException('Invalid credentials');
            mockAuthService.login.mockRejectedValue(error);

            await expect(controller.login(loginDto)).rejects.toThrow(error);
            expect(authService.login).toHaveBeenCalledWith(loginDto);
        });

        it('should handle validation errors', async () => {
            const loginDto: LoginDto = {
                email: 'invalid-email',
                password: '',
            };

            const error = new Error('Validation failed');
            mockAuthService.login.mockRejectedValue(error);

            await expect(controller.login(loginDto)).rejects.toThrow(error);
            expect(authService.login).toHaveBeenCalledWith(loginDto);
        });
    });

    describe('me', () => {
        it('should return current user profile', async () => {
            const mockRequest = {
                user: {
                    userId: 'user-id-123',
                },
            } as any;

            const expectedUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                memberships: [
                    {
                        organizationId: 'org-123',
                        role: 'OrgAdmin',
                        organization: {
                            name: 'Test Organization',
                        },
                    },
                ],
            };

            mockAuthService.me.mockResolvedValue(expectedUser);

            const result = await controller.me(mockRequest);

            expect(authService.me).toHaveBeenCalledWith('user-id-123');
            expect(result).toEqual(expectedUser);
        });

        it('should return user profile without memberships', async () => {
            const mockRequest = {
                user: {
                    userId: 'user-id-123',
                },
            } as any;

            const expectedUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                memberships: [],
            };

            mockAuthService.me.mockResolvedValue(expectedUser);

            const result = await controller.me(mockRequest);

            expect(authService.me).toHaveBeenCalledWith('user-id-123');
            expect(result).toEqual(expectedUser);
        });

        it('should handle user not found error', async () => {
            const mockRequest = {
                user: {
                    userId: 'nonexistent-user-id',
                },
            } as any;

            const error = new Error('User not found');
            mockAuthService.me.mockRejectedValue(error);

            await expect(controller.me(mockRequest)).rejects.toThrow(error);
            expect(authService.me).toHaveBeenCalledWith('nonexistent-user-id');
        });

        it('should handle database errors', async () => {
            const mockRequest = {
                user: {
                    userId: 'user-id-123',
                },
            } as any;

            const error = new Error('Database connection failed');
            mockAuthService.me.mockRejectedValue(error);

            await expect(controller.me(mockRequest)).rejects.toThrow(error);
            expect(authService.me).toHaveBeenCalledWith('user-id-123');
        });

        it('should extract userId from request correctly', async () => {
            const mockRequest = {
                user: {
                    userId: 'different-user-id',
                },
            } as any;

            const expectedUser = {
                id: 'different-user-id',
                email: 'different@example.com',
                memberships: [],
            };

            mockAuthService.me.mockResolvedValue(expectedUser);

            const result = await controller.me(mockRequest);

            expect(authService.me).toHaveBeenCalledWith('different-user-id');
            expect(result).toEqual(expectedUser);
        });

        it('should handle request without user object', () => {
            const mockRequest = {} as any;

            expect(() => controller.me(mockRequest)).toThrow();
            expect(authService.me).not.toHaveBeenCalled();
        });
    });
});
