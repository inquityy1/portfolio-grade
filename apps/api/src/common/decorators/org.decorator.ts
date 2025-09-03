import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_HEADER } from '../constants/tenancy';

export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return (req.headers[TENANT_HEADER] as string | undefined) ?? req.orgId;
});