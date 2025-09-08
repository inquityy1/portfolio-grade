import { Controller, Get, Param } from '@nestjs/common';
import { FormsService } from './forms.service';
import { OrgId } from '../../common/decorators/org.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(TenantGuard)
@Controller('public/forms')
export class FormsPublicController {
    constructor(private readonly forms: FormsService) { }

    @Get(':id')
    getPublic(@OrgId() orgId: string, @Param('id') id: string) {
        // return minimal public data (id, name, schema, fields)
        return this.forms.get(orgId, id);
    }
}