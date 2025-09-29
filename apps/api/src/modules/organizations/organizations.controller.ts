import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgAdminOnlyGuard } from '../../common/guards/org-admin-only.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';

type Role = 'OrgAdmin' | 'Editor' | 'Viewer';

@Controller('organizations')
@UseGuards(JwtAuthGuard, OrgAdminOnlyGuard)
export class OrganizationsController {
    constructor(private readonly organizations: OrganizationsService) { }

    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    findAll() {
        return this.organizations.findAll();
    }

    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.organizations.findOne(id);
    }

    @Roles('OrgAdmin' as Role)
    @RateLimit({ perUser: { limit: 5, windowSec: 60 }, perOrg: { limit: 50, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@Body() dto: CreateOrganizationDto) {
        return this.organizations.create(dto.name);
    }
}
