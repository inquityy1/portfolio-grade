import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../infra/services/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);
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

      const hashedPassword = 'hashed-password-123';
      const expectedUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        createdAt: new Date(),
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await service.register(registerDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle password hashing errors', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const error = new Error('Hashing failed');
      mockedBcrypt.hash.mockRejectedValue(error as never);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should handle user creation errors', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const hashedPassword = 'hashed-password-123';
      const error = new Error('User creation failed');

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      });
    });

    it('should handle email already exists error', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const hashedPassword = 'hashed-password-123';
      const error = new Error('User with this email already exists');

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'existing@example.com',
        password: hashedPassword,
        name: 'Test User',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'Test User',
        createdAt: new Date(),
      };

      const expectedToken = 'jwt-token-123';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id-123',
        email: 'test@example.com',
      });
      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'Test User',
        createdAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed-password-123');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt comparison errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'Test User',
        createdAt: new Date(),
      };

      const error = new Error('Bcrypt comparison failed');

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockRejectedValue(error as never);

      await expect(service.login(loginDto)).rejects.toThrow(error);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT signing errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'Test User',
        createdAt: new Date(),
      };

      const error = new Error('JWT signing failed');

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockImplementation(() => {
        throw error;
      });

      await expect(service.login(loginDto)).rejects.toThrow(error);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id-123',
        email: 'test@example.com',
      });
    });
  });

  describe('me', () => {
    it('should return user profile with memberships', async () => {
      const userId = 'user-id-123';
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

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.me(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return user profile without memberships', async () => {
      const userId = 'user-id-123';
      const expectedUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        memberships: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.me(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user is not found', async () => {
      const userId = 'nonexistent-user-id';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.me(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const userId = 'user-id-123';
      const error = new Error('Database connection failed');

      mockPrismaService.user.findUnique.mockRejectedValue(error);

      await expect(service.me(userId)).rejects.toThrow(error);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      });
    });

    it('should handle multiple memberships', async () => {
      const userId = 'user-id-123';
      const expectedUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        memberships: [
          {
            organizationId: 'org-123',
            role: 'OrgAdmin',
            organization: {
              name: 'Test Organization 1',
            },
          },
          {
            organizationId: 'org-456',
            role: 'Member',
            organization: {
              name: 'Test Organization 2',
            },
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.me(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      });
      expect(result).toEqual(expectedUser);
    });
  });
});
