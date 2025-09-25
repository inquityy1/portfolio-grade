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
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('forms')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FormsController {
    constructor(private readonly forms: FormsService) { }

    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    list(@OrgId() orgId: string) {
        return this.forms.list(orgId);
    }

    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    get(@OrgId() orgId: string, @Param('id') id: string) {
        return this.forms.get(orgId, id);
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Post()
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreateFormDto) {
        return this.forms.create(orgId, req.user.userId, dto);
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdateFormDto) {
        return this.forms.update(orgId, req.user.userId, id, dto);
    }

    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string) {
        return this.forms.remove(orgId, req.user.userId, id);
    }
}