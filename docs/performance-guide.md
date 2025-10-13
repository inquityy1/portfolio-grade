# Performance Guide

## Overview

This document provides comprehensive performance guidelines, optimizations, and monitoring strategies for the Portfolio Grade application. It covers database performance, API optimization, frontend performance, caching strategies, and monitoring approaches.

## 🗄️ Database Performance

### Index Strategy

#### Multi-Tenant Indexes

```sql
-- Primary tenant index on all organization-scoped tables
CREATE INDEX idx_posts_org_created ON posts(organizationId, createdAt DESC);
CREATE INDEX idx_tags_org_name ON tags(organizationId, name);
CREATE INDEX idx_comments_org_post ON comments(organizationId, postId, createdAt DESC);
CREATE INDEX idx_forms_org_created ON forms(organizationId, createdAt DESC);
CREATE INDEX idx_submissions_org_form ON submissions(organizationId, formId, createdAt DESC);
```

#### Foreign Key Indexes

```sql
-- All foreign key columns are indexed for efficient joins
CREATE INDEX idx_posts_author ON posts(authorId);
CREATE INDEX idx_comments_post ON comments(postId);
CREATE INDEX idx_comments_author ON comments(authorId);
CREATE INDEX idx_revisions_post ON revisions(postId);
CREATE INDEX idx_fields_form ON fields(formId);
CREATE INDEX idx_fileassets_post ON fileassets(postId);
CREATE INDEX idx_fileassets_submission ON fileassets(submissionId);
```

#### Unique Constraints

```sql
-- Prevent duplicate data and enable efficient lookups
CREATE UNIQUE INDEX idx_memberships_user_org ON memberships(userId, organizationId);
CREATE UNIQUE INDEX idx_posttags_post_tag ON posttags(postId, tagId);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Query Optimization

#### Tenant-Scoped Queries

```sql
-- Always include organizationId in WHERE clauses
-- Good: Fast tenant isolation
SELECT * FROM posts
WHERE organizationId = ? AND createdAt > ?
ORDER BY createdAt DESC
LIMIT 20;

-- Bad: Full table scan
SELECT * FROM posts
WHERE createdAt > ?
ORDER BY createdAt DESC
LIMIT 20;
```

#### Pagination Strategy

```sql
-- Cursor-based pagination for large datasets
SELECT * FROM posts
WHERE organizationId = ?
  AND createdAt < ?  -- cursor value
ORDER BY createdAt DESC
LIMIT 20;

-- Offset pagination for smaller datasets
SELECT * FROM posts
WHERE organizationId = ?
ORDER BY createdAt DESC
LIMIT 20 OFFSET ?;
```

#### N+1 Query Prevention

```typescript
// Good: Single query with includes
const posts = await prisma.post.findMany({
  where: { organizationId },
  include: {
    author: true,
    tags: true,
    comments: {
      where: { deletedAt: null },
      include: { author: true },
    },
  },
});

// Bad: N+1 queries
const posts = await prisma.post.findMany({ where: { organizationId } });
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
  post.tags = await prisma.tag.findMany({ where: { postId: post.id } });
}
```

### Database Monitoring

#### Query Performance Analysis

```sql
-- Enable query logging in development
SET log_statement = 'all';
SET log_min_duration_statement = 100; -- Log queries > 100ms

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM posts
WHERE organizationId = ? AND createdAt > ?
ORDER BY createdAt DESC LIMIT 20;
```

#### Index Usage Monitoring

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## 🚀 API Performance

### Response Optimization

#### Data Serialization

```typescript
// Use DTOs to control response size
export class PostResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  // Exclude sensitive fields
  @Exclude()
  internalNotes: string;
}
```

#### Pagination Implementation

```typescript
// Cursor-based pagination for large datasets
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
```

### Caching Strategy

#### Redis Integration

```typescript
// Rate limiting with Redis
@Injectable()
export class RateLimitService {
  async hit(key: string, limit: number, windowSec: number) {
    const redis = this.redisService.getClient();
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetSeconds: await redis.ttl(key),
    };
  }
}
```

#### Session Caching

```typescript
// Idempotency caching with Redis
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const key = req.headers['idempotency-key'];
    const orgId = req.headers['x-org-id'];
    const route = `${req.method}:${req.path}`;
    const hash = bodyHash(req.body);

    return from(
      this.prisma.idempotencyKey.findUnique({
        where: { orgId_route_key: { orgId, route, key } },
        select: { bodyHash: true, response: true },
      }),
    ).pipe(
      switchMap(found => {
        if (found && found.bodyHash === hash && found.response != null) {
          res.setHeader('X-Idempotency', 'HIT');
          return of(found.response);
        }

        return next.handle().pipe(
          tap(async data => {
            await this.prisma.idempotencyKey.update({
              where: { orgId_route_key: { orgId, route, key } },
              data: { response: data },
            });
            res.setHeader('X-Idempotency', 'MISS');
          }),
        );
      }),
    );
  }
}
```

### Background Processing

#### BullMQ Integration

```typescript
// Process background jobs for admin operations
@Injectable()
export class TagStatsProcessor {
  async enqueue(orgId: string) {
    // Queue tag statistics calculation job
    const job = await this.queue.add(
      'calculate-tag-stats',
      {
        organizationId: orgId,
        timestamp: Date.now(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return job;
  }

  @Process('calculate-tag-stats')
  async handleTagStatsCalculation(job: Job<{ organizationId: string }>) {
    const { organizationId } = job.data;

    // Calculate tag usage statistics
    const tagStats = await this.prisma.postTag.groupBy({
      by: ['tagId'],
      where: {
        post: { organizationId },
      },
      _count: { tagId: true },
    });

    // Update tag aggregates
    for (const stat of tagStats) {
      await this.prisma.tagAggregate.upsert({
        where: {
          organizationId_tagId: {
            organizationId,
            tagId: stat.tagId,
          },
        },
        update: {
          count: stat._count.tagId,
          calculatedAt: new Date(),
        },
        create: {
          organizationId,
          tagId: stat.tagId,
          count: stat._count.tagId,
          calculatedAt: new Date(),
        },
      });
    }
  }
}
```

## 🎨 Frontend Performance

### React Optimization

#### Component Memoization

```typescript
// Memoize expensive components
const PostCard = React.memo(({ post, onEdit, onDelete }) => {
  return (
    <div className='post-card'>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <div className='actions'>
        <button onClick={() => onEdit(post.id)}>Edit</button>
        <button onClick={() => onDelete(post.id)}>Delete</button>
      </div>
    </div>
  );
});

// Memoize callbacks to prevent unnecessary re-renders
const PostList = ({ posts }) => {
  const handleEdit = useCallback((postId: string) => {
    // Edit logic
  }, []);

  const handleDelete = useCallback((postId: string) => {
    // Delete logic
  }, []);

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
    </div>
  );
};
```

#### Virtual Scrolling

```typescript
// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedPostList = ({ posts }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  );

  return (
    <List height={600} itemCount={posts.length} itemSize={120} width='100%'>
      {Row}
    </List>
  );
};
```

### Data Fetching Optimization

#### React Query Configuration

```typescript
// Optimize React Query settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Use query keys for efficient caching
const usePosts = (organizationId: string, cursor?: string) => {
  return useQuery({
    queryKey: ['posts', organizationId, cursor],
    queryFn: () => fetchPosts(organizationId, cursor),
    keepPreviousData: true, // Smooth pagination
  });
};
```

#### Prefetching Strategy

```typescript
// Prefetch data for better UX
const usePostPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchPost = useCallback(
    (postId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['post', postId],
        queryFn: () => fetchPost(postId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  return { prefetchPost };
};
```

### Bundle Optimization

#### Code Splitting

```typescript
// Lazy load components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const PostEditor = lazy(() => import('./PostEditor'));
const FormBuilder = lazy(() => import('./FormBuilder'));

// Route-based code splitting
const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path='/admin'
          element={
            <Suspense fallback={<Loading />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path='/posts/:id/edit'
          element={
            <Suspense fallback={<Loading />}>
              <PostEditor />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
};
```

#### Asset Optimization

```typescript
// Vite configuration for optimal bundling
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          utils: ['lodash', 'date-fns'],
        },
      },
    },
  },
});
```

## 📊 Monitoring & Profiling

### Application Performance Monitoring

#### Rate Limiting Monitoring

```typescript
// Monitor rate limiting with Redis
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse();

    const orgId = (req.headers['x-org-id'] as string) || 'no-org';
    const userId = (req as any).user?.userId || 'anon';
    const routeKey = `${req.method}:${req.baseUrl || ''}${req.path || ''}`;

    // Check per-user rate limit
    const userKey = `user:${userId}:${routeKey}`;
    const userResult = await this.limiter.hit(userKey, 30, 60);

    // Check per-org rate limit
    const orgKey = `org:${orgId}:${routeKey}`;
    const orgResult = await this.limiter.hit(orgKey, 300, 60);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(userResult.limit));
    res.setHeader('X-RateLimit-Remaining', String(userResult.remaining));
    res.setHeader('X-RateLimit-Reset', String(Date.now() + userResult.resetSeconds * 1000));

    return userResult.allowed && orgResult.allowed;
  }
}
```

#### Custom Metrics

```typescript
// Track admin job metrics
@Injectable()
export class AdminJobsController {
  @Post('tag-stats/run')
  async runTagStats(@OrgId() orgId: string) {
    // Track job queuing
    this.logger.log(`Tag stats job queued for organization: ${orgId}`);

    await this.tagStats.enqueue(orgId);

    // Track successful job creation
    this.logger.log(`Tag stats job created successfully for org: ${orgId}`);

    return { ok: true, queued: true };
  }

  @Post('post-preview/:postId')
  async runPreview(@OrgId() orgId: string, @Param('postId') postId: string) {
    const startTime = Date.now();

    try {
      const job = await this.preview.enqueue(orgId, postId);
      const duration = Date.now() - startTime;

      this.logger.log(`Preview job processed in ${duration}ms for post: ${postId}`);

      return { ok: true, queued: true };
    } catch (error) {
      this.logger.error(`Preview job failed for post ${postId}:`, error);
      throw error;
    }
  }
}
```

### Database Performance Monitoring

#### Query Performance Tracking

```typescript
// Monitor Prisma query performance
@Injectable()
export class PostsService {
  async list(orgId: string, opts: any) {
    const startTime = Date.now();

    try {
      const result = await this.prisma.post.findMany({
        where: { organizationId: orgId },
        take: opts.limit ? Math.min(Math.max(opts.limit, 1), 50) : 10,
        cursor: opts.cursor ? { id: opts.cursor } : undefined,
        skip: opts.cursor ? 1 : 0,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          content: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
          postTags: { select: { tag: { select: { id: true, name: true } } } },
        },
      });

      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        this.logger.warn(`Slow query detected: posts.list took ${duration}ms for org: ${orgId}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Query failed after ${duration}ms:`, error);
      throw error;
    }
  }
}
```

### Frontend Performance Monitoring

#### Web Vitals Tracking

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Performance Observer

```typescript
// Monitor custom performance metrics
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure'] });

// Measure custom operations
performance.mark('post-load-start');
await loadPosts();
performance.mark('post-load-end');
performance.measure('post-load', 'post-load-start', 'post-load-end');
```

## 🔧 Performance Testing

### Load Testing

#### API Load Testing

```typescript
// Test posts API with cursor pagination
// artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Posts API operations"
    weight: 100
    flow:
      - get:
          url: "/api/posts"
          headers:
            Authorization: "Bearer {{ token }}"
            X-Org-Id: "{{ orgId }}"
          qs:
            limit: 20
      - get:
          url: "/api/posts"
          headers:
            Authorization: "Bearer {{ token }}"
            X-Org-Id: "{{ orgId }}"
          qs:
            cursor: "{{ cursor }}"
            limit: 20
```

#### Database Load Testing

```sql
-- Test concurrent posts queries with tenant isolation
-- Run multiple instances of this query simultaneously
SELECT p.*, u.name as author_name, t.name as tag_name
FROM posts p
JOIN users u ON p.authorId = u.id
LEFT JOIN post_tags pt ON p.id = pt.postId
LEFT JOIN tags t ON pt.tagId = t.id
WHERE p.organizationId = ?
ORDER BY p.createdAt DESC
LIMIT 20;

-- Test tag statistics calculation
SELECT tagId, COUNT(*) as usage_count
FROM post_tags pt
JOIN posts p ON pt.postId = p.id
WHERE p.organizationId = ?
GROUP BY tagId
ORDER BY usage_count DESC;
```

### Performance Benchmarks

#### Response Time Targets

- **API Endpoints**: < 200ms for 95th percentile
- **Posts List**: < 100ms for cursor-based pagination
- **Database Queries**: < 50ms for tenant-scoped queries
- **Admin Jobs**: < 5s for tag statistics calculation
- **Rate Limiting**: < 10ms overhead per request

#### Throughput Targets

- **API Requests**: 1000 requests/second
- **Posts List**: 500 requests/second with pagination
- **Rate Limiting**: 30 requests/minute per user, 300/minute per org
- **Background Jobs**: 100 tag stats jobs/minute processing
- **Redis Operations**: 10,000 operations/second

## 🚨 Performance Troubleshooting

### Common Performance Issues

#### Database Issues

```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Check for table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### API Issues

```typescript
// Debug slow endpoints with performance interceptor
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          console.warn(`Slow endpoint: ${request.method} ${request.url} - ${duration}ms`);
        }
      }),
    );
  }
}

// Monitor rate limiting issues
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse();

    // Log rate limit violations
    const orgId = (req.headers['x-org-id'] as string) || 'no-org';
    const userId = (req as any).user?.userId || 'anon';

    if (!userResult.allowed) {
      this.logger.warn(`Rate limit exceeded for user ${userId} in org ${orgId}`);
    }

    return userResult.allowed && orgResult.allowed;
  }
}
```

#### Frontend Issues

```typescript
// Debug React performance
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  if (actualDuration > 16) {
    // > 1 frame at 60fps
    console.warn(`Slow render: ${id} - ${actualDuration}ms`);
  }
};

const App = () => (
  <Profiler id='App' onRender={onRenderCallback}>
    {/* Your app content */}
  </Profiler>
);
```

## 📈 Performance Optimization Checklist

### Database

- [ ] All tenant-scoped queries include `organizationId`
- [ ] Foreign key columns are indexed
- [ ] Composite indexes for common query patterns
- [ ] Query performance monitored and optimized
- [ ] Connection pooling configured
- [ ] Slow query logging enabled

### API

- [ ] Response DTOs limit data exposure
- [ ] Cursor-based pagination implemented for posts
- [ ] Rate limiting with Redis for all endpoints
- [ ] Idempotency caching for POST/PATCH operations
- [ ] Background jobs for admin operations
- [ ] Performance monitoring for slow queries

### Frontend

- [ ] Components memoized where appropriate
- [ ] Virtual scrolling for large lists
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] Images optimized and lazy loaded
- [ ] Service worker for caching

### Monitoring

- [ ] Rate limiting metrics collected
- [ ] Admin job performance tracked
- [ ] Database query performance monitored
- [ ] Redis operation metrics tracked
- [ ] Error rates and slow queries logged
- [ ] Performance reviews scheduled

---

**Last Updated**: $(date)  
**Performance Targets**: API < 200ms, Posts List < 100ms, Rate Limiting < 10ms  
**Monitoring**: Redis Rate Limiting + Admin Job Metrics + Query Performance
