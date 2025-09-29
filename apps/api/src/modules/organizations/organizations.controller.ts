import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgAdminOnlyGuard } from '../../common/guards/org-admin-only.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

import type { Role } from '../../common/types/role';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, OrgAdminOnlyGuard)
export class OrganizationsController {
    constructor(private readonly organizations: OrganizationsService) { }

    @ApiOperation({
        summary: 'List all organizations',
        description: 'Retrieves all organizations in the system. Only users with OrgAdmin role in any organization can access this endpoint. Results are ordered by organization name.'
    })
    @ApiResponse({
        status: 200,
        description: 'Organizations retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'org-my-company' },
                    name: { type: 'string', example: 'My Company' },
                    createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role in any organization' })
    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    findAll() {
        return this.organizations.findAll();
    }

    @ApiOperation({
        summary: 'Get organization by ID',
        description: 'Retrieves detailed information about a specific organization including creation and update timestamps.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the organization to retrieve',
        example: 'org-my-company'
    })
    @ApiResponse({
        status: 200,
        description: 'Organization retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'org-my-company' },
                name: { type: 'string', example: 'My Company' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role in any organization' })
    @ApiResponse({ status: 404, description: 'Organization not found' })
    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.organizations.findOne(id);
    }

    @ApiOperation({
        summary: 'Create a new organization',
        description: 'Creates a new organization with the specified name. Automatically generates a URL-friendly ID and creates default system users with OrgAdmin, Editor, and Viewer roles. Organization names must be unique.'
    })
    @ApiBody({
        description: 'Organization creation data',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 100,
                    example: 'My New Company',
                    description: 'Organization name (2-100 characters, letters, numbers, spaces, hyphens, underscores only)'
                }
            },
            required: ['name']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Organization created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'org-my-new-company' },
                name: { type: 'string', example: 'My New Company' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have OrgAdmin role in any organization' })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Organization name already exists',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Organization with this name already exists' },
                error: { type: 'string', example: 'Conflict' },
                statusCode: { type: 'number', example: 409 }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'array', items: { type: 'string' }, example: ['name must be at least 2 characters long', 'name can only contain letters, numbers, spaces, hyphens, and underscores'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 5, windowSec: 60 }, perOrg: { limit: 50, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@Body() dto: CreateOrganizationDto) {
        return this.organizations.create(dto.name);
    }
}
