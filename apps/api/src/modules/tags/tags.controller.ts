import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { TagsService } from './tags.service';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TagsController {
    constructor(private readonly tags: TagsService) { }

    @ApiOperation({
        summary: 'List all tags for organization',
        description: 'Retrieves all tags belonging to the current organization, ordered by name alphabetically.'
    })
    @ApiResponse({
        status: 200,
        description: 'Tags retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                    name: { type: 'string', example: 'react' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    list(@OrgId() orgId: string) {
        return this.tags.list(orgId);
    }

    @ApiOperation({
        summary: 'Create a new tag',
        description: 'Creates a new tag with the specified name. Tag names must be unique within the organization. Automatically creates audit logs and publishes events.'
    })
    @ApiBody({
        description: 'Tag creation data',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'javascript',
                    description: 'The name of the tag (must be unique within organization)'
                }
            },
            required: ['name']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Tag created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'javascript' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Tag name already exists in organization',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tag name already exists in this org' },
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
                message: { type: 'array', items: { type: 'string' }, example: ['name must be a string'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@OrgId() orgId: string, @Req() req: any, @Body() body: { name: string }) {
        return this.tags.create(orgId, req.user.userId, body.name.trim());
    }

    @ApiOperation({
        summary: 'Update an existing tag',
        description: 'Updates the name of an existing tag. The new name must be unique within the organization. Automatically creates audit logs and publishes events.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the tag to update',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiBody({
        description: 'Updated tag data',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'typescript',
                    description: 'The updated name of the tag (must be unique within organization)'
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Tag updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'typescript' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({
        status: 404,
        description: 'Tag not found',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tag not found' },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 }
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Tag name already exists in organization',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tag name already exists in this org' },
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
                message: { type: 'array', items: { type: 'string' }, example: ['name must be a string'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() body: { name?: string }) {
        return this.tags.update(orgId, req.user.userId, id, { name: body.name?.trim() });
    }

    @ApiOperation({
        summary: 'Delete a tag',
        description: 'Permanently deletes a tag and all its associations. This action cannot be undone and will remove the tag from all posts. Automatically creates audit logs and publishes events.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the tag to delete',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Tag deleted successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'javascript' },
                deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T12:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({
        status: 404,
        description: 'Tag not found',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tag not found' },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string) {
        return this.tags.remove(orgId, req.user.userId, id);
    }
}