import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '../../common/types/role';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Forms')
@ApiBearerAuth()
@Controller('forms')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FormsController {
    constructor(private readonly forms: FormsService) { }

    @ApiOperation({
        summary: 'List all forms for organization',
        description: 'Retrieves all forms belonging to the current organization, ordered by last updated date descending.'
    })
    @ApiResponse({
        status: 200,
        description: 'Forms retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                    name: { type: 'string', example: 'Contact Form' },
                    schema: {
                        type: 'object',
                        example: {
                            title: 'Contact Us',
                            description: 'Get in touch with us',
                            fields: []
                        },
                        description: 'Form schema configuration'
                    },
                    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
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
        return this.forms.list(orgId);
    }

    @ApiOperation({
        summary: 'Get a specific form by ID',
        description: 'Retrieves a specific form with its associated fields. Includes field ordering and complete form schema.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the form to retrieve',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Form retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'Contact Form' },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Contact Us',
                        description: 'Get in touch with us',
                        fields: []
                    }
                },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                fields: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                            label: { type: 'string', example: 'Email Address' },
                            type: { type: 'string', example: 'email' },
                            order: { type: 'number', example: 0 },
                            config: { type: 'object', example: { required: true } }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Form not found' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    get(@OrgId() orgId: string, @Param('id') id: string) {
        return this.forms.get(orgId, id);
    }

    @ApiOperation({
        summary: 'Create a new form',
        description: 'Creates a new form with the specified name and schema configuration. The schema defines the form structure and behavior.'
    })
    @ApiBody({
        description: 'Form creation data',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'Contact Form',
                    description: 'The name/title of the form'
                },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Contact Us',
                        description: 'Get in touch with us',
                        fields: [],
                        settings: {
                            allowMultipleSubmissions: false,
                            requireAuthentication: false
                        }
                    },
                    description: 'Form schema configuration (JSON object)'
                }
            },
            required: ['name', 'schema']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Form created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'Contact Form' },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Contact Us',
                        description: 'Get in touch with us',
                        fields: []
                    }
                },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or schema format' })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreateFormDto) {
        return this.forms.create(orgId, req.user.userId, dto);
    }

    @ApiOperation({
        summary: 'Update an existing form',
        description: 'Updates the name and/or schema of an existing form. All fields are optional and only provided fields will be updated.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the form to update',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiBody({
        description: 'Updated form data',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'Updated Contact Form',
                    description: 'The updated name/title of the form'
                },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Updated Contact Us',
                        description: 'Updated description',
                        fields: [],
                        settings: {
                            allowMultipleSubmissions: true,
                            requireAuthentication: true
                        }
                    },
                    description: 'Updated form schema configuration'
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Form updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'Updated Contact Form' },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Updated Contact Us',
                        description: 'Updated description',
                        fields: []
                    }
                },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T11:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Form not found' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or schema format' })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdateFormDto) {
        return this.forms.update(orgId, req.user.userId, id, dto);
    }

    @ApiOperation({
        summary: 'Delete a form',
        description: 'Permanently deletes a form and all its associated fields and submissions. This action cannot be undone.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the form to delete',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Form deleted successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                name: { type: 'string', example: 'Contact Form' },
                schema: {
                    type: 'object',
                    example: {
                        title: 'Contact Us',
                        description: 'Get in touch with us',
                        fields: []
                    }
                },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Form not found' })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string) {
        return this.forms.remove(orgId, req.user.userId, id);
    }
}