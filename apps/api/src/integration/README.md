# Integration Tests for API

This directory contains **true integration tests** that test the API with real database and Redis connections, using a **separate test database** to ensure complete isolation from production data.

## 🎯 **What These Tests Cover**

### **Authentication Integration Tests** (`auth.integration.spec.ts`)
- ✅ **Login workflow** with real database validation
- ✅ **Registration** with email uniqueness checks
- ✅ **Token validation** with JWT verification
- ✅ **Protected route access** with real authorization
- ✅ **Role-based access control** across different endpoints

### **CRUD Integration Tests** (`crud.integration.spec.ts`)
- ✅ **Complete CRUD lifecycle** for Forms, Posts, Tags, Comments
- ✅ **Database relationships** and constraints
- ✅ **Proper pagination** with database-level sorting
- ✅ **Cascade deletions** and orphaned records
- ✅ **Data validation** at database level

### **Business Logic Integration Tests** (`business-logic.integration.spec.ts`)
- ✅ **Form submission workflow** (Form → Fields → Submission)
- ✅ **Role-based permissions** enforcement
- ✅ **Tag statistics aggregation** with real database queries
- ✅ **Multi-tenant isolation** (Organization boundaries)
- ✅ **Rate limiting** integration with Redis
- ✅ **Caching** behavior with Redis

## 🚀 **Quick Start**

### Prerequisites
- PostgreSQL database running and accessible
- Redis server running and accessible
- **Separate test database** created and migrated

### Test Database Setup

1. **Create test database:**
   ```bash
   # On Windows (if you have PostgreSQL installed)
   createdb portfolio_grade_test
   
   # Or manually via psql
   psql -U postgres -c "CREATE DATABASE portfolio_grade_test;"
   ```

2. **Run migrations on test database:**
   ```bash
   npm run migrate:test-db
   ```

3. **Set environment variables (optional):**
   ```bash
   # Add to your .env file or set in your environment
   TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/portfolio_grade_test
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ```

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npx jest apps/api/src/integration/auth.integration.spec.ts --config=apps/api/jest.integration.config.ts
```

## 🏗️ **Architecture**

### **Test Database Isolation**
- **Separate database**: `portfolio_grade_test` (completely isolated from production)
- **Full cleanup**: Each test run starts with a clean database
- **No production data risk**: Production data is never touched

### **Test Setup Process**
1. **Before each test**: Complete database cleanup
2. **Seed test data**: Create minimal required data
3. **Run test**: Execute test with real database/Redis
4. **Cleanup**: Remove all test data

### **Test Data Management**
- **Unique identifiers**: Timestamp-based IDs prevent conflicts
- **Minimal data**: Only create what's needed for each test
- **Complete cleanup**: Delete all data after each test

## 📊 **Test Database Configuration**

### **Database URL**
- **Default**: `postgresql://postgres:password@localhost:5432/portfolio_grade_test`
- **Override**: Set `TEST_DATABASE_URL` environment variable

### **Redis Configuration**
- **Default**: `redis://localhost:6379`
- **Override**: Set `REDIS_URL` environment variable
- **Fallback**: Uses mock Redis if not available

## 🔧 **Configuration Files**

### **Jest Configuration** (`jest.integration.config.ts`)
- **Test environment**: Node.js
- **Timeout**: 30 seconds per test
- **Sequential execution**: `maxWorkers: 1` to avoid database conflicts
- **Setup file**: `src/integration/test-setup.ts`

### **Test Setup** (`test-setup.ts`)
- **Database connection**: Uses test database URL
- **Cleanup methods**: Complete database cleanup
- **Seed data**: Creates minimal test data
- **Global setup**: Database preparation

## 🧪 **Test Structure**

### **Test Context**
```typescript
interface IntegrationTestContext {
    app: INestApplication;
    prisma: PrismaService;
    redis: RedisService;
    httpServer: any;
}
```

### **Test Data**
```typescript
interface TestData {
    user: { id: string; email: string; password: string; name: string; };
    organization: { id: string; name: string; };
    token: string;
}
```

### **Test Lifecycle**
```typescript
beforeAll(async () => {
    context = await IntegrationTestSetup.createTestApp();
});

beforeEach(async () => {
    await IntegrationTestSetup.cleanupTestData(context);
    testData = await IntegrationTestSetup.seedTestData(context);
});

afterAll(async () => {
    await context.app.close();
});
```

## 🚨 **Important Notes**

### **Database Safety**
- ✅ **Production data is NEVER touched**
- ✅ **Test database is completely separate**
- ✅ **Full cleanup after each test**
- ✅ **No data persistence between tests**

### **Performance**
- ⚠️ **Slower than unit tests** (real database/Redis)
- ⚠️ **Sequential execution** (no parallel tests)
- ⚠️ **Database cleanup overhead**

### **Dependencies**
- **PostgreSQL**: Must be running and accessible
- **Redis**: Must be running and accessible
- **Test database**: Must exist and be migrated

## 🔍 **Troubleshooting**

### **Database Connection Issues**
```bash
# Check if PostgreSQL is running
pg_isready

# Check if test database exists
psql -U postgres -l | grep portfolio_grade_test

# Recreate test database
dropdb portfolio_grade_test
createdb portfolio_grade_test
npm run migrate:test-db
```

### **Redis Connection Issues**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (if not running)
redis-server
```

### **Test Failures**
- **Check database permissions**: Ensure user can create/delete tables
- **Check Redis connection**: Ensure Redis is accessible
- **Check test database**: Ensure it exists and is migrated
- **Check environment variables**: Ensure correct URLs are set

## 📈 **Coverage**

These integration tests provide **end-to-end coverage** of:
- **API endpoints** with real HTTP requests
- **Database operations** with real PostgreSQL
- **Authentication flow** with real JWT tokens
- **Authorization logic** with real role checks
- **Business logic** with real data relationships
- **External services** with real Redis connections

## 🎉 **Benefits**

- ✅ **Complete isolation** from production data
- ✅ **Real database testing** with actual constraints
- ✅ **End-to-end validation** of API workflows
- ✅ **Confidence in deployments** with real integration testing
- ✅ **Safe testing** with separate test database
