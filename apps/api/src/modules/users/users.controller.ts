import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  Delete,
  UseInterceptors,
  Req,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({
    summary: 'List all users in organization',
    description:
      'Retrieves all users who are members of the current organization, ordered by creation date ascending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
          email: { type: 'string', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
  @Roles('OrgAdmin' as Role)
  // @UseInterceptors(CacheInterceptor)
  @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Get()
  getAll(@OrgId() orgId: string) {
    return this.users.findAllByOrg(orgId);
  }

  @ApiOperation({
    summary: 'Create a new user with organization membership',
    description:
      'Creates a new user account and automatically assigns them to the specified organization with the given role. The user can be assigned to any organization, not just the current one.',
  })
  @ApiBody({
    description: 'User creation data with organization assignment',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'newuser@example.com',
          description: 'Valid email address (must be unique)',
        },
        password: {
          type: 'string',
          minLength: 6,
          example: 'password123',
          description: 'User password (minimum 6 characters)',
        },
        name: {
          type: 'string',
          example: 'Jane Smith',
          description: 'Full name of the user',
        },
        role: {
          type: 'string',
          enum: ['OrgAdmin', 'Editor', 'Viewer'],
          example: 'Editor',
          description: 'Role to assign to the user in the organization',
        },
        organizationId: {
          type: 'string',
          example: 'org-a',
          description:
            'Optional organization ID to assign the user to (defaults to current organization)',
        },
      },
      required: ['email', 'password', 'name', 'role'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        email: { type: 'string', example: 'newuser@example.com' },
        name: { type: 'string', example: 'Jane Smith' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
        membership: {
          type: 'object',
          properties: {
            organizationId: { type: 'string', example: 'org-a' },
            role: { type: 'string', example: 'Editor' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'email must be a valid email',
            'password must be at least 6 characters',
            'role must be one of: OrgAdmin, Editor, Viewer',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @Roles('OrgAdmin' as Role)
  @UseInterceptors(IdempotencyInterceptor)
  @RateLimit({ perUser: { limit: 5, windowSec: 60 }, perOrg: { limit: 50, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateUserDto) {
    return this.users.createUserWithMembership(orgId, dto);
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves detailed information about a specific user who is a member of the current organization.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the user to retrieve',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
  @ApiResponse({
    status: 404,
    description: 'User not found in organization',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User not found in this organization' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @Roles('Editor' as Role)
  // @UseInterceptors(CacheInterceptor)
  @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.users.findOneInOrg(id, orgId);
  }

  @ApiOperation({
    summary: 'Update user information',
    description:
      'Updates user information including name, email, and password. All fields are optional and only provided fields will be updated. Password is automatically hashed.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the user to update',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiBody({
    description: 'Updated user data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Updated Doe',
          description: 'Updated full name of the user',
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'updated@example.com',
          description: 'Updated email address (must be unique)',
        },
        password: {
          type: 'string',
          minLength: 6,
          example: 'newpassword123',
          description: 'Updated password (minimum 6 characters, will be hashed)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        email: { type: 'string', example: 'updated@example.com' },
        name: { type: 'string', example: 'John Updated Doe' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T11:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email must be a valid email', 'password must be at least 6 characters'],
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @Roles('OrgAdmin' as Role)
  @UseInterceptors(IdempotencyInterceptor)
  @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Patch(':id')
  update(@Param('id') id: string, @OrgId() orgId: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, orgId, dto);
  }

  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Permanently deletes a user account and all associated data. This action cannot be undone and will remove the user from all organizations and delete all their posts, comments, and other data.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the user to delete',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T12:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role' })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @Roles('OrgAdmin' as Role)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
