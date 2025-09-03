import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Controller('tags')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TagsController {
    constructor(private readonly tags: TagsService) { }

    // Anyone in org can list
    @Roles('Viewer' as Role)
    @Get()
    list(@OrgId() orgId: string) {
        return this.tags.list(orgId);
    }

    // Create/update/delete reserved for Editors or higher positions
    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Post()
    create(@OrgId() orgId: string, @Body() dto: CreateTagDto) {
        return this.tags.create(orgId, dto.name.trim());
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Patch(':id')
    update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateTagDto) {
        return this.tags.update(orgId, id, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Param('id') id: string) {
        return this.tags.remove(orgId, id);
    }
}