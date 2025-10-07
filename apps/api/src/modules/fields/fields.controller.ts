import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Fields')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FieldsController {
  constructor(private readonly fields: FieldsService) {}

  @ApiOperation({
    summary: 'Create a new field for a form',
    description:
      'Creates a new field within a specific form. Fields define the input elements that users will interact with when filling out the form.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the form to add a field to',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiBody({
    description: 'Field configuration data',
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          example: 'Email Address',
          description: 'The display label for the field',
        },
        type: {
          type: 'string',
          example: 'email',
          description: 'The field type (text, email, number, select, textarea, etc.)',
        },
        config: {
          type: 'object',
          example: { required: true, placeholder: 'Enter your email' },
          description: 'Additional configuration options for the field',
        },
        order: {
          type: 'number',
          minimum: 0,
          example: 1,
          description: 'Display order of the field (0-based)',
        },
      },
      required: ['label', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Field created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
        formId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        label: { type: 'string', example: 'Email Address' },
        type: { type: 'string', example: 'email' },
        order: { type: 'number', example: 1 },
        config: { type: 'object', example: { required: true, placeholder: 'Enter your email' } },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @Roles('Editor' as Role)
  @Post('forms/:id/fields')
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @OrgId() orgId: string,
    @Req() req: any,
    @Param('id') formId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fields.create(orgId, req.user.userId, formId, dto);
  }

  @ApiOperation({
    summary: 'Update a field',
    description:
      'Updates the configuration of an existing field. All fields are optional and only provided fields will be updated.',
  })
  @ApiParam({
    name: 'fieldId',
    description: 'The unique identifier of the field to update',
    example: 'cmg564i3w0004uh18drhjd...',
  })
  @ApiBody({
    description: 'Updated field configuration data',
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          example: 'Full Name',
          description: 'The updated display label for the field',
        },
        type: {
          type: 'string',
          example: 'text',
          description: 'The updated field type',
        },
        config: {
          type: 'object',
          example: { required: true, placeholder: 'Enter your full name', maxLength: 100 },
          description: 'Updated configuration options for the field',
        },
        order: {
          type: 'number',
          minimum: 0,
          example: 0,
          description: 'Updated display order of the field',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Field updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
        formId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        label: { type: 'string', example: 'Full Name' },
        type: { type: 'string', example: 'text' },
        order: { type: 'number', example: 0 },
        config: {
          type: 'object',
          example: { required: true, placeholder: 'Enter your full name', maxLength: 100 },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @Roles('Editor' as Role)
  @Patch('fields/:fieldId')
  @UseInterceptors(IdempotencyInterceptor)
  update(
    @OrgId() orgId: string,
    @Req() req: any,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.fields.update(orgId, req.user.userId, fieldId, dto);
  }

  @ApiOperation({
    summary: 'Delete a field',
    description:
      'Permanently deletes a field from a form. This action cannot be undone and will remove the field from all form submissions.',
  })
  @ApiParam({
    name: 'fieldId',
    description: 'The unique identifier of the field to delete',
    example: 'cmg564i3w0004uh18drhjd...',
  })
  @ApiResponse({
    status: 200,
    description: 'Field deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
        formId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        label: { type: 'string', example: 'Email Address' },
        type: { type: 'string', example: 'email' },
        order: { type: 'number', example: 1 },
        config: { type: 'object', example: { required: true, placeholder: 'Enter your email' } },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @Roles('Editor' as Role)
  @Delete('fields/:fieldId')
  @UseInterceptors(IdempotencyInterceptor)
  remove(@OrgId() orgId: string, @Req() req: any, @Param('fieldId') fieldId: string) {
    return this.fields.remove(orgId, req.user.userId, fieldId);
  }
}
