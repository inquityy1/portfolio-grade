import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AuditLogsController {
    constructor(private readonly logs: AuditLogsService) { }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Get()
    list(@OrgId() orgId: string, @Query() query: any) {
        return this.logs.list(orgId, query);
    }
}