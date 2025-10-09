# Portfolio Grade - Full Stack Application

A modern full-stack application built with NestJS, React, and PostgreSQL.

## Quick Start with Docker

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

## Available Docker Commands

- `npm run docker:start` - Start all services
- `npm run docker:stop` - Stop all services
- `npm run docker:restart` - Restart all services
- `npm run docker:logs` - View logs from all services
- `npm run docker:build` - Build all Docker images
- `npm run docker:test` - Run integration tests in Docker
- `npm run docker:test:all` - Run all tests in Docker
- `npm run docker:clean` - Clean up Docker containers and volumes

## Services

- **API**: http://localhost:3001/api
- **Admin**: http://localhost:4202
- **Portal**: http://localhost:4203
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Local Development

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

## Testing

- `npm run test` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run e2e:test` - Run end-to-end tests
- `npm run test:all` - Run all tests

## Project Structure

```
apps/
├── api/          # NestJS API server
├── admin/        # React admin dashboard
├── portal/       # React portal application
├── admin-e2e/    # Admin E2E tests
└── portal-e2e/   # Portal E2E tests

packages/
├── ui-kit/       # Shared UI components
├── shared/       # Shared utilities
└── app-state/    # Redux state management
```
