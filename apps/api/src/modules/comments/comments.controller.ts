import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Role } from '@portfolio-grade/shared';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CommentsController {
    constructor(private readonly comments: CommentsService) { }

    // List comments
    @ApiOperation({
        summary: 'List comments for a post',
        description: 'Retrieves all non-deleted comments for a specific post, ordered by creation date ascending.'
    })
    @ApiParam({
        name: 'postId',
        description: 'The unique identifier of the post to get comments for',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Comments retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                    authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                    content: { type: 'string', example: 'This is a great post!' },
                    createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @Roles('Viewer' as Role)
    @Get('posts/:postId/comments')
    // @UseInterceptors(CacheInterceptor)
    list(@OrgId() orgId: string, @Param('postId') postId: string) {
        return this.comments.list(orgId, postId);
    }

    // Create comment
    @ApiOperation({
        summary: 'Create a new comment',
        description: 'Creates a new comment on a specific post. The comment will be associated with the authenticated user.'
    })
    @ApiParam({
        name: 'postId',
        description: 'The unique identifier of the post to comment on',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiBody({
        description: 'Comment content',
        schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    minLength: 1,
                    example: 'This is a great post! I really enjoyed reading it.',
                    description: 'The comment content (minimum 1 character)'
                }
            },
            required: ['content']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Comment created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                content: { type: 'string', example: 'This is a great post!' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @Roles('Viewer' as Role)
    @Post('posts/:postId/comments')
    @UseInterceptors(IdempotencyInterceptor)
    create(@OrgId() orgId: string, @Param('postId') postId: string, @Req() req: any, @Body() dto: CreateCommentDto) {
        return this.comments.create(orgId, postId, req.user.userId, dto.content);
    }

    // Update comment
    @ApiOperation({
        summary: 'Update a comment',
        description: 'Updates the content of an existing comment. Only the comment author can update their own comments.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the comment to update',
        example: 'cmg564i3w0004uh18drhjd...'
    })
    @ApiBody({
        description: 'Updated comment content',
        schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    minLength: 1,
                    example: 'Updated comment content here.',
                    description: 'The updated comment content (minimum 1 character)'
                }
            },
            required: ['content']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Comment updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                content: { type: 'string', example: 'Updated comment content here.' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T11:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role, or not the comment author' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
    @Roles('Viewer' as Role)
    @Patch('comments/:id')
    @UseInterceptors(IdempotencyInterceptor)
    update(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any, @Body() dto: UpdateCommentDto) {
        return this.comments.update(orgId, id, req.user.userId, dto.content);
    }

    // Delete comment
    @ApiOperation({
        summary: 'Delete a comment',
        description: 'Soft deletes a comment (marks as deleted but doesn\'t remove from database). Only the comment author can delete their own comments.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the comment to delete',
        example: 'cmg564i3w0004uh18drhjd...'
    })
    @ApiResponse({
        status: 200,
        description: 'Comment deleted successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T12:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role, or not the comment author' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @Roles('Viewer' as Role)
    @Delete('comments/:id')
    @UseInterceptors(IdempotencyInterceptor)
    remove(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any) {
        return this.comments.remove(orgId, id, req.user.userId);
    }

    // Restore comment
    @ApiOperation({
        summary: 'Restore a deleted comment',
        description: 'Restores a previously soft-deleted comment. Only users with Editor or higher role can restore comments.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the comment to restore',
        example: 'cmg564i3w0004uh18drhjd...'
    })
    @ApiResponse({
        status: 200,
        description: 'Comment restored successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                content: { type: 'string', example: 'This is a great post!' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00Z' },
                deletedAt: { type: 'null', example: null }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @Roles('Editor' as Role)
    @Post('comments/:id/restore')
    @UseInterceptors(IdempotencyInterceptor)
    restore(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any) {
        return this.comments.restore(orgId, id, req.user.userId);
    }
}