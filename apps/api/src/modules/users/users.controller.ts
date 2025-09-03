import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Roles('OrgAdmin' as Role)
    @Get()
    getAll(@OrgId() orgId: string) {
        return this.users.findAllByOrg(orgId);
    }

    @Roles('OrgAdmin' as Role, 'Editor' as Role)
    @Get(':id')
    getOne(@Param('id') id: string, @OrgId() orgId: string) {
        return this.users.findOneInOrg(id, orgId);
    }
}