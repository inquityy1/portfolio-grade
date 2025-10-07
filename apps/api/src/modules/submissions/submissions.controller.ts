import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Submissions')
@Controller()
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  // PUBLIC submit form
  @ApiOperation({
    summary: 'Submit form data (Public)',
    description:
      'Allows public users to submit form data without authentication. This endpoint is accessible to anyone and is rate-limited by IP address to prevent abuse.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the form to submit data to',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiBody({
    description: 'Form submission data',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          example: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello, this is a test submission!',
          },
          description: 'Form data as key-value pairs matching the form fields',
        },
      },
      required: ['data'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Form submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
        formId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        data: {
          type: 'object',
          example: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello, this is a test submission!',
          },
        },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Form not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Too many requests from this IP, please try again later',
        },
        error: { type: 'string', example: 'Too Many Requests' },
        statusCode: { type: 'number', example: 429 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid submission data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'array', items: { type: 'string' }, example: ['data must be an object'] },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @UseGuards(TenantGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @RateLimit({ perIp: { limit: 10, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Post('public/forms/:id/submit')
  submitPublic(
    @OrgId() orgId: string,
    @Param('id') formId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissions.createSubmission(orgId, formId, dto.data);
  }

  // ADMIN list submissions for a form
  @ApiOperation({
    summary: 'List form submissions (Admin)',
    description:
      'Retrieves all submissions for a specific form. Only accessible to users with Editor or higher role. Results are ordered by submission date descending.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the form to get submissions for',
    example: 'cmg564i1k0000uh18stz8dk1r',
  })
  @ApiResponse({
    status: 200,
    description: 'Form submissions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
          data: {
            type: 'object',
            example: {
              name: 'John Doe',
              email: 'john@example.com',
              message: 'Hello, this is a test submission!',
            },
            description: 'Submitted form data',
          },
          createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Form not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('Editor' as Role)
  // @UseInterceptors(CacheInterceptor)
  @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Get('forms/:id/submissions')
  listAdmin(@OrgId() orgId: string, @Param('id') formId: string) {
    return this.submissions.listSubmissions(orgId, formId);
  }

  @ApiOperation({
    summary: 'Get specific submission (Admin)',
    description:
      'Retrieves detailed information about a specific submission by its ID. Accessible to users with Viewer or higher role.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'submissionId',
    description: 'The unique identifier of the submission to retrieve',
    example: 'cmg564i3w0004uh18drhjd...',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
        formId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
        data: {
          type: 'object',
          example: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello, this is a test submission!',
            phone: '+1234567890',
            company: 'Acme Corp',
          },
          description: 'Complete submitted form data',
        },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Submission not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('Viewer' as Role, 'Editor' as Role)
  // @UseInterceptors(CacheInterceptor)
  @RateLimit({ perUser: { limit: 10, windowSec: 60 }, perOrg: { limit: 100, windowSec: 60 } })
  @UseGuards(RateLimitGuard)
  @Get('submissions/:submissionId')
  getAdmin(@OrgId() orgId: string, @Param('submissionId') submissionId: string) {
    return this.submissions.getSubmission(orgId, submissionId);
  }
}
