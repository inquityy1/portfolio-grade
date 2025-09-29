import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '../../common/types/role';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AuditLogsController {
    constructor(private readonly logs: AuditLogsService) { }

    @ApiOperation({
        summary: 'List audit logs for organization',
        description: 'Retrieves audit logs for the current organization with optional filtering. Supports pagination, date range filtering, and filtering by resource type and action. Results are ordered by timestamp descending.'
    })
    @ApiQuery({
        name: 'resource',
        required: false,
        description: 'Filter by resource type (e.g., "Post", "User", "Form")',
        example: 'Post'
    })
    @ApiQuery({
        name: 'action',
        required: false,
        description: 'Filter by action type (e.g., "CREATE", "UPDATE", "DELETE")',
        example: 'CREATE'
    })
    @ApiQuery({
        name: 'from',
        required: false,
        description: 'Start date for filtering (ISO 8601 format)',
        example: '2024-01-01T00:00:00Z'
    })
    @ApiQuery({
        name: 'to',
        required: false,
        description: 'End date for filtering (ISO 8601 format)',
        example: '2024-01-31T23:59:59Z'
    })
    @ApiQuery({
        name: 'cursor',
        required: false,
        description: 'Pagination cursor for next page',
        example: 'cmg564i3w0004uh18drhjd...'
    })
    @ApiQuery({
        name: 'take',
        required: false,
        description: 'Number of records to return (1-100, default: 20)',
        example: 50
    })
    @ApiResponse({
        status: 200,
        description: 'Audit logs retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                    at: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                    userId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                    action: { type: 'string', example: 'CREATE' },
                    resource: { type: 'string', example: 'Post' },
                    resourceId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @Roles('Editor' as Role)
    @Get()
    // @UseInterceptors(CacheInterceptor)
    list(@OrgId() orgId: string, @Query() query: any) {
        return this.logs.list(orgId, query);
    }
}