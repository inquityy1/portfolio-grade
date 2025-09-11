import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { FormsService } from './forms.service';
import { OrgId } from '../../common/decorators/org.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';

@UseGuards(TenantGuard)
@UseInterceptors(CacheInterceptor)
@RateLimit({ perIp: { limit: 10, windowSec: 60 } })
@UseGuards(RateLimitGuard)
@Controller('public/forms')
export class FormsPublicController {
    constructor(private readonly forms: FormsService) { }

    @Get(':id')
    getPublic(@OrgId() orgId: string, @Param('id') id: string) {
        // return minimal public data (id, name, schema, fields)
        return this.forms.get(orgId, id);
    }
}