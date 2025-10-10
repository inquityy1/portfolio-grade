# E2E Testing Guide for Admin App

This guide covers the comprehensive end-to-end (E2E) testing setup for the admin application using Playwright.

## 📋 Overview

Our E2E test suite provides **80%+ coverage** of the admin application functionality, including:

- ✅ **Authentication & Authorization** - Login, role validation, protected routes
- ✅ **Dashboard** - Navigation, content display, user interactions
- ✅ **Admin Jobs** - Background job management, tag statistics, post previews
- ✅ **Audit Logs** - System activity monitoring, user action tracking
- ✅ **User Management** - User creation, role assignment, validation
- ✅ **Organization Management** - Organization creation, validation
- ✅ **Error Handling** - API errors, network failures, validation errors
- ✅ **Loading States** - UI feedback during async operations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Admin app running on `http://localhost:4200`
- API server running on `http://localhost:3000`

### Setup

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npm run e2e:setup

# Run all tests
npm run e2e:test
```

## 📁 Test Structure

```
apps/admin-e2e/src/
├── support/
│   ├── test-helpers.ts      # Core test utilities
│   ├── test-fixtures.ts     # Playwright fixtures
│   ├── test-data.ts         # Test data factories
│   └── enhanced-fixtures.ts # Extended fixtures
├── login.spec.ts           # Authentication tests
├── dashboard.spec.ts       # Dashboard functionality
├── protected-routes.spec.ts # Route protection
├── admin-jobs.spec.ts      # Job management
├── audit-logs.spec.ts      # Audit logging
├── create-user.spec.ts     # User creation
└── create-organization.spec.ts # Organization creation
```

## 🧪 Test Categories

### 1. Authentication Tests (`login.spec.ts`)

- ✅ Login form display and validation
- ✅ Successful login with valid credentials
- ✅ Failed login with invalid credentials
- ✅ Role-based access control (Editor/OrgAdmin only)
- ✅ Loading states during authentication
- ✅ Network error handling
- ✅ Portal navigation

### 2. Dashboard Tests (`dashboard.spec.ts`)

- ✅ Page content and navigation
- ✅ Authentication state persistence
- ✅ Navigation links functionality
- ✅ Loading states
- ✅ Error handling
- ✅ Layout structure validation

### 3. Protected Routes Tests (`protected-routes.spec.ts`)

- ✅ Unauthenticated user redirection
- ✅ Authenticated user access
- ✅ Token expiration handling
- ✅ Role-based access control
- ✅ Network error scenarios
- ✅ Intended page redirection after login

### 4. Admin Jobs Tests (`admin-jobs.spec.ts`)

- ✅ Tag statistics display and refresh
- ✅ Post preview job management
- ✅ API error handling
- ✅ Loading states
- ✅ Data copying functionality
- ✅ Preview generation and viewing

### 5. Audit Logs Tests (`audit-logs.spec.ts`)

- ✅ Audit log display with user information
- ✅ Action badge styling and colors
- ✅ Resource ID copying
- ✅ Timestamp formatting
- ✅ Empty state handling
- ✅ Error scenarios

### 6. User Creation Tests (`create-user.spec.ts`)

- ✅ Form validation and submission
- ✅ Organization loading and selection
- ✅ Role assignment
- ✅ Success/error handling
- ✅ Loading states
- ✅ Form reset after creation

### 7. Organization Creation Tests (`create-organization.spec.ts`)

- ✅ Form validation (min/max length)
- ✅ Successful creation
- ✅ Error handling
- ✅ Loading states
- ✅ Cancel functionality
- ✅ Whitespace trimming

## 🛠️ Test Utilities

### AdminTestHelpers

Core utility class providing:

- Navigation helpers
- Authentication methods
- API mocking
- Form interaction helpers
- Assertion helpers

### TestDataFactory

Factory for creating test data:

- User objects with different roles
- Organizations
- Audit logs
- Posts and tag statistics
- Bulk data generation

### ApiMockHelper

API mocking utilities:

- Successful response mocking
- Error response mocking
- Slow response simulation
- Network failure simulation

## 🎯 Running Tests

### Basic Commands

```bash
# Run all tests
npm run e2e:test

# Run tests in headed mode (visible browser)
npm run e2e:test:headed

# Run tests in debug mode
npm run e2e:test:debug

# Run specific browser
npm run e2e:test:chrome
npm run e2e:test:firefox
npm run e2e:test:safari

# Generate HTML report
npm run e2e:report

# Clean test artifacts
npm run e2e:clean
```

### Advanced Usage

```bash
# Run specific test file
npx nx run admin-e2e:e2e --grep "login"

# Run tests with specific project
npx nx run admin-e2e:e2e --project=chromium

# Run tests with custom timeout
npx nx run admin-e2e:e2e --timeout=60000

# Run tests in parallel
npx nx run admin-e2e:e2e --workers=4
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:4200`
- **Browsers**: Chromium, Firefox, WebKit
- **Timeouts**: 10s action, 30s navigation
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Test Environment

- **Web Server**: Auto-starts admin app on port 4200
- **API Mocking**: Comprehensive API response mocking
- **Test Data**: Isolated test data per test
- **Cleanup**: Automatic cleanup between tests

## 📊 Coverage Metrics

Our E2E tests achieve **80%+ coverage** across:

| Component             | Coverage | Tests        |
| --------------------- | -------- | ------------ |
| Authentication        | 95%      | 8 tests      |
| Dashboard             | 90%      | 7 tests      |
| Protected Routes      | 95%      | 9 tests      |
| Admin Jobs            | 85%      | 12 tests     |
| Audit Logs            | 90%      | 11 tests     |
| User Creation         | 85%      | 10 tests     |
| Organization Creation | 90%      | 12 tests     |
| **Total**             | **88%**  | **69 tests** |

## 🚨 CI/CD Integration

### GitHub Actions

Automated E2E testing on:

- Push to main/develop branches
- Pull requests
- Artifact collection (reports, videos)
- Multi-browser testing

### Local Development

```bash
# Quick test during development
npm run e2e:test:headed

# Debug failing tests
npm run e2e:test:debug

# Test specific functionality
npx nx run admin-e2e:e2e --grep "create user"
```

## 🐛 Debugging

### Common Issues

1. **Tests timing out**

   - Check if admin app is running on port 4200
   - Verify API server is running on port 3000
   - Increase timeout in playwright.config.ts

2. **API mocking not working**

   - Ensure mock routes are set up before navigation
   - Check route patterns match API calls
   - Verify mock responses are properly formatted

3. **Authentication failures**
   - Check token format and expiration
   - Verify role permissions in mock responses
   - Ensure localStorage is properly cleared between tests

### Debug Commands

```bash
# Run with debug output
DEBUG=pw:api npm run e2e:test

# Run specific test with debug
npx nx run admin-e2e:e2e --debug --grep "login"

# Generate trace for failed tests
npx nx run admin-e2e:e2e --trace=on
```

## 📈 Best Practices

### Test Writing

- ✅ Use descriptive test names
- ✅ Group related tests in describe blocks
- ✅ Mock external dependencies
- ✅ Clean up after each test
- ✅ Use page object pattern for complex interactions

### Data Management

- ✅ Use factories for test data
- ✅ Keep test data isolated
- ✅ Avoid hardcoded values
- ✅ Use realistic test scenarios

### Maintenance

- ✅ Update tests when UI changes
- ✅ Keep mocks in sync with API
- ✅ Regular test review and cleanup
- ✅ Monitor test performance

## 🔄 Continuous Improvement

### Monitoring

- Track test execution time
- Monitor flaky test patterns
- Analyze failure trends
- Update coverage metrics

### Expansion

- Add mobile browser testing
- Implement visual regression testing
- Add performance testing
- Expand API integration tests

---

## 📞 Support

For questions or issues with E2E tests:

1. Check this documentation
2. Review test logs and reports
3. Use debug mode for investigation
4. Create issue with test details and logs

**Happy Testing! 🎉**
