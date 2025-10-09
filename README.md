# Portfolio Grade - Full Stack Application

A modern full-stack application built with NestJS, React, and PostgreSQL for managing portfolios and assessments.

## 🚀 Quick Start

The easiest way to get started is using Docker:

```bash
# Clone the repository
git clone <your-repo-url>
cd portfolio-grade

# Install dependencies
npm install

# Start all services (PostgreSQL, Redis, API, Admin, Portal)
npm run docker:start

# Wait for services to be ready, then run tests
npm run docker:test:all
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin App     │    │   Portal App    │    │   API Server    │
│   (React)       │    │   (React)       │    │   (NestJS)      │
│   Port: 4200    │    │   Port: 4201    │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │     Redis       │
                    │   Port: 5432    │    │   Port: 6379    │
                    └─────────────────┘    └─────────────────┘
```

## 🐳 Docker Commands

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `npm run docker:start`      | Start all services                     |
| `npm run docker:stop`       | Stop all services                      |
| `npm run docker:restart`    | Restart all services                   |
| `npm run docker:logs`       | View logs from all services            |
| `npm run docker:build`      | Build all Docker images                |
| `npm run docker:test`       | Run integration tests in Docker        |
| `npm run docker:test:all`   | Run all tests in Docker                |
| `npm run docker:e2e:admin`  | Run admin e2e tests in Docker          |
| `npm run docker:e2e:portal` | Run portal e2e tests in Docker         |
| `npm run docker:e2e:all`    | Run all e2e tests in Docker            |
| `npm run docker:clean`      | Clean up Docker containers and volumes |

## 🌐 Services

| Service        | URL                       | Description               |
| -------------- | ------------------------- | ------------------------- |
| **API**        | http://localhost:3000/api | NestJS backend API        |
| **Admin**      | http://localhost:4200     | React admin dashboard     |
| **Portal**     | http://localhost:4201     | React portal application  |
| **PostgreSQL** | localhost:5432            | Database server           |
| **Redis**      | localhost:6379            | Cache and background jobs |

## 🔧 Environment Setup

1. **Copy environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Update database credentials** in `.env` if needed:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/portfolio_grade?schema=public"
   TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/portfolio_grade_test?schema=public"
   REDIS_URL="redis://localhost:6379"
   ```

## 🗄️ Database Setup

### With Docker (Recommended):

```bash
# Start services
npm run docker:start

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api npm run prisma:seed
```

### Local Development:

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

## 👤 Default Credentials

After seeding the database, you can log in with:

| Role         | Email              | Password  |
| ------------ | ------------------ | --------- |
| **OrgAdmin** | adminA@example.com | admin123  |
| **Editor**   | editor@example.com | editor123 |
| **Viewer**   | viewer@example.com | viewer123 |

## 🚀 Local Development

If you prefer to run services locally:

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run migrations
npm run prisma:migrate

# Start API
npm run serve:api

# Start Admin (in another terminal)
npm run serve:admin

# Start Portal (in another terminal)
npm run serve:portal
```

## 🧪 Testing

| Command                    | Description                  |
| -------------------------- | ---------------------------- |
| `npm run test`             | Run unit tests               |
| `npm run test:affected`    | Run tests for affected files |
| `npm run test:integration` | Run integration tests        |
| `npm run e2e:test`         | Run end-to-end tests         |
| `npm run test:all`         | Run all tests                |

### Running Tests in Docker:

```bash
# Unit and integration tests
npm run docker:test:all

# E2E tests
npm run docker:e2e:all
```

## 📁 Project Structure

```
portfolio-grade/
├── apps/
│   ├── api/              # NestJS API server
│   ├── admin/            # React admin dashboard
│   ├── portal/           # React portal application
│   ├── admin-e2e/        # Admin E2E tests
│   └── portal-e2e/       # Portal E2E tests
├── packages/
│   ├── ui-kit/           # Shared UI components
│   ├── shared/           # Shared utilities
│   └── app-state/        # Redux state management
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker configuration
└── README.md
```

## 🔌 API Documentation

Once the API is running, you can access:

- **Swagger UI**: http://localhost:3000/api/docs
- **API Endpoints**: http://localhost:3000/api

## 🛠️ Development Workflow

1. **Make changes** to your code
2. **Run tests** to ensure everything works
3. **Commit changes** (pre-commit hooks will run automatically)
4. **Push to repository**

### Pre-commit Hooks

The project uses Husky to run pre-commit hooks that will:

- ✅ **Lint** your code
- ✅ **Run unit tests** for affected files
- ✅ **Run integration tests** (if API files changed)
- ✅ **Run e2e tests** (if frontend files changed)

## 🐛 Troubleshooting

### Common Issues:

**1. Port already in use:**

```bash
# Stop all Docker containers
docker-compose down

# Or kill processes using the ports
npx kill-port 3000 4200 4201 5432 6379
```

**2. Database connection issues:**

```bash
# Restart database
docker-compose restart postgres

# Check database status
docker-compose exec postgres pg_isready -U postgres
```

**3. Docker build failures:**

```bash
# Clean Docker cache
npm run docker:clean

# Rebuild without cache
docker-compose build --no-cache
```

**4. E2E tests failing:**

```bash
# Make sure API is running
npm run docker:start

# Run e2e tests locally (not in Docker)
npm run e2e:test
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines:

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

**Happy coding! 🚀**
