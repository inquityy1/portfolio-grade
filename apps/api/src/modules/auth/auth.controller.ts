import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @ApiOperation({
        summary: 'Register a new user',
        description: 'Creates a new user account with email, password, and name. The password is automatically hashed for security.'
    })
    @ApiBody({
        description: 'User registration data',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                    description: 'Valid email address'
                },
                password: {
                    type: 'string',
                    minLength: 6,
                    example: 'password123',
                    description: 'Password (minimum 6 characters)'
                },
                name: {
                    type: 'string',
                    example: 'John Doe',
                    description: 'Full name of the user'
                }
            },
            required: ['email', 'password', 'name']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data or validation errors',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'array', items: { type: 'string' }, example: ['email must be a valid email', 'password must be at least 6 characters'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Email already exists',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User with this email already exists' },
                error: { type: 'string', example: 'Conflict' },
                statusCode: { type: 'number', example: 409 }
            }
        }
    })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.auth.register(dto);
    }

    @ApiOperation({
        summary: 'Login user',
        description: 'Authenticates a user with email and password, returning a JWT access token for subsequent API calls.'
    })
    @ApiBody({
        description: 'User login credentials',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                    description: 'User email address'
                },
                password: {
                    type: 'string',
                    example: 'password123',
                    description: 'User password'
                }
            },
            required: ['email', 'password']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                access_token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    description: 'JWT access token for API authentication'
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'array', items: { type: 'string' }, example: ['email must be a valid email'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid credentials',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid credentials' },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 }
            }
        }
    })
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto);
    }

    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Retrieves the current authenticated user\'s profile information including their memberships and organization details.'
    })
    @ApiBearerAuth()
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                email: { type: 'string', example: 'user@example.com' },
                memberships: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            organizationId: { type: 'string', example: 'org-a' },
                            role: { type: 'string', example: 'OrgAdmin' },
                            organization: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Organization A' }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing JWT token',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Unauthorized' },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 }
            }
        }
    })
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.auth.me(userId);
    }
}