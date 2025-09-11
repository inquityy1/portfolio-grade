import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Controller('forms')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FormsController {
    constructor(private readonly forms: FormsService) { }

    @Roles('Viewer' as Role)
    @Get()
    @UseInterceptors(CacheInterceptor)
    list(@OrgId() orgId: string) {
        return this.forms.list(orgId);
    }

    @Roles('Viewer' as Role)
    @Get(':id')
    @UseInterceptors(CacheInterceptor)
    get(@OrgId() orgId: string, @Param('id') id: string) {
        return this.forms.get(orgId, id);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Post()
    @UseInterceptors(IdempotencyInterceptor)
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreateFormDto) {
        return this.forms.create(orgId, req.user.userId, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Patch(':id')
    @UseInterceptors(IdempotencyInterceptor)
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdateFormDto) {
        return this.forms.update(orgId, req.user.userId, id, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Delete(':id')
    @UseInterceptors(IdempotencyInterceptor)
    remove(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string) {
        return this.forms.remove(orgId, req.user.userId, id);
    }
}