import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, UseGuards, Req, Query, UseInterceptors } from '@nestjs/common';
import type { Role } from '../../common/types/role';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrgId } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
// import { CacheInterceptor } from '../../common/cache/cache.interceptor';
import { IdempotencyInterceptor } from '../../common/http/idempotency/idempotency.interceptor';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PostsController {
    constructor(private readonly posts: PostsService) { }

    @ApiOperation({
        summary: 'List posts with filtering and pagination',
        description: 'Retrieves posts for the current organization with optional filtering by search query, tag, and pagination. Supports cursor-based pagination and includes file assets if requested.'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of posts to return (1-50, default: 10)',
        example: 20
    })
    @ApiQuery({
        name: 'cursor',
        required: false,
        description: 'Pagination cursor for next page',
        example: 'cmg564i3w0004uh18drhjd...'
    })
    @ApiQuery({
        name: 'q',
        required: false,
        description: 'Search query to filter posts by title or content',
        example: 'react tutorial'
    })
    @ApiQuery({
        name: 'tagId',
        required: false,
        description: 'Filter posts by specific tag ID',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiQuery({
        name: 'includeFileAssets',
        required: false,
        description: 'Include file assets in response (true/false)',
        example: 'true'
    })
    @ApiResponse({
        status: 200,
        description: 'Posts retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                posts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                            title: { type: 'string', example: 'Getting Started with React' },
                            content: { type: 'string', example: 'React is a powerful library...' },
                            version: { type: 'number', example: 1 },
                            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                            authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                            postTags: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        tag: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                                                name: { type: 'string', example: 'react' }
                                            }
                                        }
                                    }
                                }
                            },
                            fileAssets: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                                        url: { type: 'string', example: 'https://example.com/image.jpg' },
                                        mimeType: { type: 'string', example: 'image/jpeg' }
                                    }
                                }
                            }
                        }
                    }
                },
                nextCursor: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                hasMore: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 30, windowSec: 60 }, perOrg: { limit: 300, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get()
    list(
        @OrgId() orgId: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('q') q?: string,
        @Query('tagId') tagId?: string,
        @Query('includeFileAssets') includeFileAssets?: string,
    ) {
        return this.posts.list(orgId, {
            limit: limit ? Number(limit) : undefined,
            cursor: cursor ?? null,
            q: q ?? null,
            tagId: tagId ?? null,
            includeFileAssets: includeFileAssets === 'true',
        });
    }

    @ApiOperation({
        summary: 'Get a specific post by ID',
        description: 'Retrieves detailed information about a specific post including its content, tags, file assets, and metadata.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post to retrieve',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Post retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                title: { type: 'string', example: 'Getting Started with React' },
                content: { type: 'string', example: 'React is a powerful library for building user interfaces...' },
                version: { type: 'number', example: 1 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                postTags: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tag: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                                    name: { type: 'string', example: 'react' }
                                }
                            }
                        }
                    }
                },
                fileAssets: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'cmg564i3w0004uh18drhjd...' },
                            url: { type: 'string', example: 'https://example.com/image.jpg' },
                            mimeType: { type: 'string', example: 'image/jpeg' }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @RateLimit({ perUser: { limit: 30, windowSec: 60 }, perOrg: { limit: 300, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Get(':id')
    getOne(@OrgId() orgId: string, @Param('id') id: string) {
        return this.posts.getOne(orgId, id);
    }

    // Create / update / delete
    @ApiOperation({
        summary: 'Create a new post',
        description: 'Creates a new post with the specified title, content, and optional tags. Automatically updates tag usage counts and generates preview images.'
    })
    @ApiBody({
        description: 'Post creation data',
        schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    minLength: 2,
                    example: 'Getting Started with React',
                    description: 'Post title (minimum 2 characters)'
                },
                content: {
                    type: 'string',
                    minLength: 1,
                    example: 'React is a powerful library for building user interfaces...',
                    description: 'Post content (minimum 1 character)'
                },
                tagIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['cmg564i1k0000uh18stz8dk1r', 'cmg564i1k0000uh18stz8dk2r'],
                    description: 'Optional array of tag IDs to associate with the post'
                }
            },
            required: ['title', 'content']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Post created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                title: { type: 'string', example: 'Getting Started with React' },
                content: { type: 'string', example: 'React is a powerful library...' },
                version: { type: 'number', example: 1 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                postTags: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tag: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                                    name: { type: 'string', example: 'react' }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'array', items: { type: 'string' }, example: ['title must be at least 2 characters long', 'content must be at least 1 character long'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 30, windowSec: 60 }, perOrg: { limit: 300, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @HttpPost()
    create(@OrgId() orgId: string, @Req() req: any, @Body() dto: CreatePostDto) {
        const authorId = req.user.userId;
        return this.posts.create(orgId, authorId, dto);
    }

    @ApiOperation({
        summary: 'Update an existing post',
        description: 'Updates an existing post with optimistic locking. Requires the current version number to prevent conflicts. Automatically updates tag usage counts when tags are changed.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post to update',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiBody({
        description: 'Updated post data with version for optimistic locking',
        schema: {
            type: 'object',
            properties: {
                version: {
                    type: 'number',
                    minimum: 1,
                    example: 1,
                    description: 'Current version number for optimistic locking (required)'
                },
                title: {
                    type: 'string',
                    minLength: 2,
                    example: 'Updated: Getting Started with React',
                    description: 'Updated post title (minimum 2 characters)'
                },
                content: {
                    type: 'string',
                    minLength: 1,
                    example: 'Updated content about React...',
                    description: 'Updated post content (minimum 1 character)'
                },
                tagIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['cmg564i1k0000uh18stz8dk1r', 'cmg564i1k0000uh18stz8dk3r'],
                    description: 'Updated array of tag IDs (replaces existing tags)'
                }
            },
            required: ['version']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Post updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                title: { type: 'string', example: 'Updated: Getting Started with React' },
                content: { type: 'string', example: 'Updated content about React...' },
                version: { type: 'number', example: 2 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T11:30:00Z' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                postTags: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tag: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                                    name: { type: 'string', example: 'react' }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Version mismatch (optimistic locking)',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Post has been modified by another user' },
                error: { type: 'string', example: 'Conflict' },
                statusCode: { type: 'number', example: 409 }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'array', items: { type: 'string' }, example: ['version must be a number', 'title must be at least 2 characters long'] },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 30, windowSec: 60 }, perOrg: { limit: 300, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Patch(':id')
    update(@OrgId() orgId: string, @Req() req: any, @Param('id') id: string, @Body() dto: UpdatePostDto) {
        const authorId = req.user.userId;
        return this.posts.update(orgId, id, authorId, dto);
    }

    @ApiOperation({
        summary: 'Delete a post',
        description: 'Permanently deletes a post and all its associated data. Automatically decrements tag usage counts for all associated tags.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post to delete',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Post deleted successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                title: { type: 'string', example: 'Getting Started with React' },
                deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T12:30:00Z' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @RateLimit({ perUser: { limit: 30, windowSec: 60 }, perOrg: { limit: 300, windowSec: 60 } })
    @UseGuards(RateLimitGuard)
    @Delete(':id')
    remove(@OrgId() orgId: string, @Param('id') id: string, @Req() req: any,) {
        const userId = req.user.userId;
        return this.posts.remove(orgId, id, userId);
    }

    // Revisions
    @ApiOperation({
        summary: 'List post revisions',
        description: 'Retrieves all revision history for a specific post, showing version numbers and timestamps.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post to get revisions for',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiResponse({
        status: 200,
        description: 'Post revisions retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    version: { type: 'number', example: 1 },
                    createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                    title: { type: 'string', example: 'Getting Started with React' },
                    content: { type: 'string', example: 'React is a powerful library...' }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @Get(':id/revisions')
    listRevisions(@OrgId() orgId: string, @Param('id') id: string) {
        return this.posts.listRevisions(orgId, id);
    }


    @ApiOperation({
        summary: 'Get specific post revision',
        description: 'Retrieves a specific version of a post from its revision history.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiParam({
        name: 'version',
        description: 'The version number to retrieve',
        example: '1'
    })
    @ApiResponse({
        status: 200,
        description: 'Post revision retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                version: { type: 'number', example: 1 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                title: { type: 'string', example: 'Getting Started with React' },
                content: { type: 'string', example: 'React is a powerful library...' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Viewer or higher role' })
    @ApiResponse({ status: 404, description: 'Post or revision not found' })
    @Roles('Viewer' as Role)
    // @UseInterceptors(CacheInterceptor)
    @Get(':id/revisions/:version')
    getRevision(@OrgId() orgId: string, @Param('id') id: string, @Param('version') version: string) {
        return this.posts.getRevision(orgId, id, Number(version));
    }

    @ApiOperation({
        summary: 'Rollback post to specific revision',
        description: 'Rolls back a post to a specific version from its revision history. Creates a new version with the content from the specified revision.'
    })
    @ApiParam({
        name: 'id',
        description: 'The unique identifier of the post to rollback',
        example: 'cmg564i1k0000uh18stz8dk1r'
    })
    @ApiParam({
        name: 'version',
        description: 'The version number to rollback to',
        example: '1'
    })
    @ApiResponse({
        status: 200,
        description: 'Post rolled back successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                title: { type: 'string', example: 'Getting Started with React' },
                content: { type: 'string', example: 'React is a powerful library...' },
                version: { type: 'number', example: 3 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00Z' },
                authorId: { type: 'string', example: 'cmg564i1k0000uh18stz8dk1r' },
                rolledBackFromVersion: { type: 'number', example: 1 }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
    @ApiResponse({ status: 403, description: 'Forbidden - User does not have Editor or higher role' })
    @ApiResponse({ status: 404, description: 'Post or revision not found' })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid version number',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid version number' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @Roles('Editor' as Role)
    @UseInterceptors(IdempotencyInterceptor)
    @HttpPost(':id/revisions/:version/rollback')
    rollback(
        @OrgId() orgId: string,
        @Req() req: any,
        @Param('id') id: string,
        @Param('version') version: string
    ) {
        return this.posts.rollbackToRevision(orgId, id, req.user.userId, Number(version));
    }
}