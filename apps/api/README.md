# Portfolio Grade API

A robust NestJS-based REST API for managing portfolios, assessments, and user interactions. Built with TypeScript, PostgreSQL, Redis, and comprehensive testing.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start the API server
npm run serve:api
```

The API will be available at: **http://localhost:3000/api**

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **Redis** (v6 or higher)
- **npm** (v8 or higher)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Portfolio Grade API                      │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Guards  │  Interceptors      │
│  ├─ Auth      │  ├─ Auth   │  ├─ JWT  │  ├─ Cache         │
│  ├─ Users     │  ├─ Users  │  ├─ Roles│  ├─ Idempotency   │
│  ├─ Forms     │  ├─ Forms  │  ├─ Rate │  └─ Validation    │
│  ├─ Posts     │  ├─ Posts  │  └─ Tenant│                   │
│  ├─ Tags      │  ├─ Tags   │           │                   │
│  ├─ Comments  │  ├─ Comments│          │                   │
│  └─ Admin     │  └─ Admin   │           │                   │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                     │
│  ├─ Prisma Service (Database ORM)                          │
│  ├─ Redis Service (Caching & Background Jobs)              │
│  ├─ Queue Service (Bull Queue)                             │
│  └─ Rate Limiting Service                                  │
├─────────────────────────────────────────────────────────────┤
│                    External Services                        │
│  ├─ PostgreSQL Database                                     │
│  └─ Redis Cache                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Environment Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/portfolio_grade?schema=public"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/portfolio_grade_test?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_TTL="900s"
JWT_REFRESH_TTL="7d"

# Application
NODE_ENV="development"
PORT="3000"
TENANT_HEADER="X-Org-Id"
```

## 🗄️ Database Setup

### With Docker (Recommended):

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

### Local PostgreSQL:

```bash
# Create database
createdb portfolio_grade

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## 🔐 Authentication

The API uses JWT-based authentication with role-based access control:

### Authentication Flow:

1. **Login** → Receive access & refresh tokens
2. **Include Bearer token** in Authorization header
3. **Access protected routes** based on user role

### User Roles:

- **OrgAdmin**: Full access to organization resources
- **Editor**: Can create/edit content
- **Viewer**: Read-only access

### Example Authentication:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Use token
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Available Scripts

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run serve:api`        | Start API server in development mode |
| `npm run build:api`        | Build API for production             |
| `npm run test`             | Run unit tests                       |
| `npm run test:integration` | Run integration tests                |
| `npm run test:all`         | Run all tests (unit + integration)   |
| `npm run prisma:migrate`   | Run database migrations              |
| `npm run prisma:seed`      | Seed database with initial data      |
| `npm run prisma:studio`    | Open Prisma Studio                   |

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests for specific module
npm run test -- --testPathPattern=auth
```

### Integration Tests

```bash
# Run integration tests (requires PostgreSQL + Redis)
npm run test:integration

# Run specific integration test
npm run test:integration -- --testNamePattern="Auth Integration"
```

### Test Database Setup

```bash
# Create test database
createdb portfolio_grade_test

# Run migrations on test database
npm run migrate:test-db
```

## 📁 Project Structure

```
apps/api/
├── src/
│   ├── app/                    # Main application module
│   ├── common/                 # Shared utilities
│   │   ├── decorators/         # Custom decorators
│   │   ├── guards/            # Authentication & authorization guards
│   │   ├── http/              # HTTP interceptors
│   │   └── constants/         # Application constants
│   ├── infra/                 # Infrastructure services
│   │   ├── services/          # Core services (Prisma, Redis, Queue)
│   │   └── jobs/              # Background job processors
│   ├── integration/           # Integration tests
│   └── modules/               # Feature modules
│       ├── auth/              # Authentication module
│       ├── users/             # User management
│       ├── forms/             # Form management
│       ├── posts/             # Post management
│       ├── tags/              # Tag management
│       ├── comments/          # Comment system
│       ├── submissions/       # Form submissions
│       ├── organizations/     # Organization management
│       ├── admin-jobs/        # Admin job processing
│       └── audit-logs/        # Audit logging
├── Dockerfile                 # Docker configuration
├── jest.config.ts            # Unit test configuration
├── jest.integration.config.ts # Integration test configuration
└── webpack.config.js         # Build configuration
```

## 🔌 Core Modules

### Authentication Module (`/auth`)

- **Login/Register** endpoints
- **JWT token** generation and validation
- **Password hashing** with bcrypt
- **Refresh token** rotation

### Users Module (`/users`)

- **User CRUD** operations
- **Profile management**
- **Role assignment**
- **Organization membership**

### Forms Module (`/forms`)

- **Dynamic form** creation
- **Field management** (text, select, checkbox, etc.)
- **Form validation** rules
- **Public form** submission endpoints

### Posts Module (`/posts`)

- **Content management** system
- **Rich text** support
- **Tag associations**
- **Comment system**

### Organizations Module (`/organizations`)

- **Multi-tenant** support
- **Organization** management
- **User membership**
- **Resource isolation**

### Admin Jobs Module (`/admin-jobs`)

- **Background job** processing
- **Tag statistics** aggregation
- **Post preview** generation
- **Queue management**

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based** authentication
- **Role-based** access control (RBAC)
- **Multi-tenant** isolation
- **Password** hashing with bcrypt

### Rate Limiting

- **Per-endpoint** rate limiting
- **Redis-backed** rate limiting
- **Configurable** limits per role
- **IP-based** throttling

### Data Validation

- **DTO validation** with class-validator
- **Input sanitization**
- **SQL injection** prevention (Prisma ORM)
- **XSS protection**

### Audit Logging

- **User action** tracking
- **Resource access** logging
- **Security event** monitoring
- **Compliance** reporting

## 🚀 Performance Features

### Caching

- **Redis-based** caching
- **Response caching** with TTL
- **Database query** optimization
- **Cache invalidation** strategies

### Background Jobs

- **Bull Queue** integration
- **Async processing** for heavy operations
- **Job retry** mechanisms
- **Progress tracking**

### Database Optimization

- **Prisma ORM** for type-safe queries
- **Connection pooling**
- **Query optimization**
- **Index management**

## 🐳 Docker Support

### Build and Run

```bash
# Build API image
docker build -f apps/api/Dockerfile -t portfolio-grade-api .

# Run with Docker Compose
docker-compose up api
```

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/portfolio_grade
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=your-secret-key
NODE_ENV=production
```

## 🔍 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Users

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Forms

- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/public/forms/:id/submit` - Submit form (public)

### Posts

- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Organizations

- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed:**

```bash
# Check PostgreSQL status
pg_isready

# Verify database exists
psql -U postgres -l | grep portfolio_grade
```

**2. Redis Connection Failed:**

```bash
# Check Redis status
redis-cli ping

# Start Redis if not running
redis-server
```

**3. Migration Errors:**

```bash
# Reset database
npm run prisma:migrate reset

# Deploy migrations
npm run prisma:migrate deploy
```

**4. Test Failures:**

```bash
# Clean test database
dropdb portfolio_grade_test
createdb portfolio_grade_test
npm run migrate:test-db
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run serve:api

# Enable Prisma query logging
DEBUG=prisma:* npm run serve:api
```

## 📊 Monitoring & Logging

### Health Checks

- **Database connectivity** check
- **Redis connectivity** check
- **Service status** endpoint

### Logging

- **Structured logging** with Winston
- **Request/Response** logging
- **Error tracking** and reporting
- **Performance metrics**

## 🤝 Contributing

1. **Follow** the existing code style
2. **Write tests** for new features
3. **Update documentation** as needed
4. **Ensure all tests pass** before submitting

### Development Guidelines:

- Use **TypeScript** strictly
- Follow **NestJS** conventions
- Write **comprehensive tests**
- Document **API changes**
- Use **meaningful commit messages**

---

**Happy coding! 🚀**
