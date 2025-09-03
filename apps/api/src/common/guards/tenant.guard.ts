import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TENANT_HEADER } from '../constants/tenancy';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const orgId = req.headers[TENANT_HEADER] as string | undefined;

        if (!orgId) {
            throw new ForbiddenException(`Missing tenant header "${TENANT_HEADER}"`);
        }

        // Attach for easy access later
        req.orgId = orgId;
        return true;
    }
}