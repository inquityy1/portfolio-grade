import { Body, Controller, Delete, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@prisma/client';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FieldsController {
    constructor(private readonly fields: FieldsService) { }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Post('forms/:id/fields')
    @UseInterceptors(IdempotencyInterceptor)
    create(@OrgId() orgId: string, @Req() req: any, @Param('id') formId: string, @Body() dto: CreateFieldDto) {
        return this.fields.create(orgId, req.user.userId, formId, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Patch('fields/:fieldId')
    @UseInterceptors(IdempotencyInterceptor)
    update(@OrgId() orgId: string, @Req() req: any, @Param('fieldId') fieldId: string, @Body() dto: UpdateFieldDto) {
        return this.fields.update(orgId, req.user.userId, fieldId, dto);
    }

    @Roles('Editor' as Role, 'OrgAdmin' as Role)
    @Delete('fields/:fieldId')
    @UseInterceptors(IdempotencyInterceptor)
    remove(@OrgId() orgId: string, @Req() req: any, @Param('fieldId') fieldId: string) {
        return this.fields.remove(orgId, req.user.userId, fieldId);
    }
}