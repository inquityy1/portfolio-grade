import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { InfraModule } from '../../infra/infra.module';
import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { OrgAdminOnlyGuard } from '../../common/guards/org-admin-only.guard';

@Module({
    imports: [InfraModule],
    controllers: [OrganizationsController],
    providers: [OrganizationsService, CacheInterceptor, RateLimitGuard, OrgAdminOnlyGuard],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
