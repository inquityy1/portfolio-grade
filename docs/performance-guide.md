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
async getPosts(
  @Query('cursor') cursor?: string,
  @Query('limit') limit = 20,
  @Tenant() tenant: TenantContext
) {
  const posts = await this.postService.findMany({
    organizationId: tenant.organizationId,
    cursor,
    limit: Math.min(limit, 100) // Cap at 100
  });

  return {
    data: posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1].id : null
  };
}
```

### Caching Strategy

#### Redis Integration

```typescript
// Cache frequently accessed data
@Injectable()
export class PostService {
  async findById(id: string, organizationId: string): Promise<Post> {
    const cacheKey = `post:${organizationId}:${id}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const post = await this.prisma.post.findFirst({
      where: { id, organizationId },
      include: { author: true, tags: true },
    });

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(post));

    return post;
  }
}
```

#### Session Caching

```typescript
// Cache user sessions and roles
@Injectable()
export class AuthService {
  async getUserRoles(userId: string): Promise<Membership[]> {
    const cacheKey = `user:${userId}:roles`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
    });

    // Cache for 10 minutes
    await this.redis.setex(cacheKey, 600, JSON.stringify(memberships));

    return memberships;
  }
}
```

### Background Processing

#### BullMQ Integration

```typescript
// Process heavy operations asynchronously
@Injectable()
export class FileProcessingService {
  async processFileUpload(fileId: string) {
    await this.fileQueue.add(
      'process-file',
      {
        fileId,
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
  }

  @Process('process-file')
  async handleFileProcessing(job: Job<{ fileId: string }>) {
    const { fileId } = job.data;

    // Process file (resize, optimize, etc.)
    await this.processFile(fileId);

    // Update database
    await this.prisma.fileAsset.update({
      where: { id: fileId },
      data: { status: 'processed' },
    });
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

#### OpenTelemetry Integration

```typescript
// Instrument API endpoints
@Controller('posts')
export class PostController {
  @Get()
  @Trace('get-posts')
  async getPosts(@Tenant() tenant: TenantContext) {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'organization.id': tenant.organizationId,
      'user.id': tenant.userId,
    });

    try {
      const posts = await this.postService.findMany(tenant.organizationId);
      span?.setStatus({ code: SpanStatusCode.OK });
      return posts;
    } catch (error) {
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    }
  }
}
```

#### Custom Metrics

```typescript
// Track business metrics
@Injectable()
export class MetricsService {
  private readonly postCounter = new Counter({
    name: 'posts_created_total',
    help: 'Total number of posts created',
    labelNames: ['organization_id'],
  });

  private readonly responseTimeHistogram = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
  });

  incrementPostCreated(organizationId: string) {
    this.postCounter.inc({ organization_id: organizationId });
  }

  recordResponseTime(method: string, route: string, statusCode: number, duration: number) {
    this.responseTimeHistogram.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }
}
```

### Database Performance Monitoring

#### Query Performance Tracking

```typescript
// Monitor slow queries
@Injectable()
export class DatabaseMonitoringService {
  async logSlowQuery(query: string, duration: number, params: any[]) {
    if (duration > 1000) {
      // Log queries > 1 second
      this.logger.warn('Slow query detected', {
        query,
        duration,
        params,
      });
    }
  }

  async analyzeQueryPerformance(query: string) {
    const result = await this.prisma.$queryRaw`
      EXPLAIN ANALYZE ${Prisma.raw(query)}
    `;

    this.logger.info('Query analysis', { query, result });
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
// Use Artillery for load testing
// artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Post CRUD operations"
    weight: 100
    flow:
      - post:
          url: "/api/posts"
          json:
            title: "Test Post"
            content: "Test Content"
      - get:
          url: "/api/posts"
```

#### Database Load Testing

```sql
-- Test concurrent queries
-- Run multiple instances of this query simultaneously
SELECT p.*, u.name as author_name, t.name as tag_name
FROM posts p
JOIN users u ON p.authorId = u.id
LEFT JOIN post_tags pt ON p.id = pt.postId
LEFT JOIN tags t ON pt.tagId = t.id
WHERE p.organizationId = ?
ORDER BY p.createdAt DESC
LIMIT 20;
```

### Performance Benchmarks

#### Response Time Targets

- **API Endpoints**: < 200ms for 95th percentile
- **Database Queries**: < 100ms for 95th percentile
- **Frontend Page Load**: < 2s for First Contentful Paint
- **Frontend Interactions**: < 100ms for user interactions

#### Throughput Targets

- **API Requests**: 1000 requests/second
- **Database Connections**: 100 concurrent connections
- **File Uploads**: 100MB/second throughput
- **Background Jobs**: 1000 jobs/minute processing

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
// Debug slow endpoints
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
- [ ] Pagination implemented for large datasets
- [ ] Caching strategy for frequently accessed data
- [ ] Background processing for heavy operations
- [ ] Rate limiting implemented
- [ ] Request/response compression enabled

### Frontend

- [ ] Components memoized where appropriate
- [ ] Virtual scrolling for large lists
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] Images optimized and lazy loaded
- [ ] Service worker for caching

### Monitoring

- [ ] Performance metrics collected
- [ ] Slow queries logged and analyzed
- [ ] Error rates monitored
- [ ] User experience metrics tracked
- [ ] Alerting configured for performance issues
- [ ] Regular performance reviews scheduled

---

**Last Updated**: $(date)  
**Performance Targets**: Response times < 200ms, Throughput > 1000 req/s  
**Monitoring**: OpenTelemetry + Custom Metrics + Web Vitals
