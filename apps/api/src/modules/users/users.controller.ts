import { Controller, Get, Param, UseGuards, Patch, Body, Delete, UseInterceptors, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Roles('OrgAdmin' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    getAll(@OrgId() orgId: string) {
        return this.users.findAllByOrg(orgId);
    }

    @Roles('Editor' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    getOne(@Param('id') id: string, @OrgId() orgId: string) {
        return this.users.findOneInOrg(id, orgId);
    }

    @Roles('OrgAdmin' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @OrgId() orgId: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.users.update(id, orgId, dto);
    }

    @Roles('OrgAdmin' as Role)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.users.remove(id);
    }
}