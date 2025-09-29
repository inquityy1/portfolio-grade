import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { FormsService } from './forms.service';
import { OrgId } from '../../common/decorators/org.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Forms Public')
@UseGuards(TenantGuard)
// @UseInterceptors(CacheInterceptor)
@RateLimit({ perIp: { limit: 10, windowSec: 10 } })
@UseGuards(RateLimitGuard)
@Controller('public/forms')
export class FormsPublicController {
    constructor(private readonly forms: FormsService) { }

    @ApiOperation({
        summary: 'Get public form data',
        description: 'Retrieves public form information including form schema and fields. This endpoint is accessible without authentication and is designed for public form rendering. Rate limited to prevent abuse.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the form to retrieve',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Public form data retrieved successfully',
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
                        fields: [],
                        settings: {
                            allowMultipleSubmissions: false,
                            requireAuthentication: false
                        }
                    },
                    description: 'Form schema configuration for rendering'
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
                            config: { type: 'object', example: { required: true, placeholder: 'Enter your email' } }
                        }
                    },
                    description: 'Form fields ordered by display order'
                }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Form not found',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Form not found' },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 }
            }
        }
    })
    @ApiResponse({
        status: 429,
        description: 'Too Many Requests - Rate limit exceeded',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Too many requests from this IP, please try again later' },
                error: { type: 'string', example: 'Too Many Requests' },
                statusCode: { type: 'number', example: 429 }
            }
        }
    })
    @Get(':id')
    getPublic(@OrgId() orgId: string, @Param('id') id: string) {
        // return minimal public data (id, name, schema, fields)
        return this.forms.get(orgId, id);
    }
}