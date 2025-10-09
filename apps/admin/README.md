# Portfolio Grade Admin Dashboard

A modern React-based admin dashboard for managing portfolios, users, organizations, and system administration. Built with TypeScript, Redux Toolkit, and a comprehensive UI component library.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the API server (required)
npm run serve:api

# Start the admin dashboard
npm run serve:admin
```

The admin dashboard will be available at: **http://localhost:4200**

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **API Server** running on http://localhost:3000/api

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Admin Dashboard (React)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages & Components  │  State Management  │  UI Components   │
│  ├─ Dashboard        │  ├─ Redux Store   │  ├─ Buttons      │
│  ├─ Login            │  ├─ Auth Slice    │  ├─ Forms        │
│  ├─ Admin Jobs       │  ├─ User Slice    │  ├─ Tables      │
│  ├─ Audit Logs       │  └─ API Slice     │  ├─ Alerts      │
│  ├─ Create User      │                   │  └─ Layout      │
│  └─ Create Org       │                   │                 │
├─────────────────────────────────────────────────────────────┤
│                    Shared Packages                          │
│  ├─ @portfolio-grade/ui-kit (UI Components)                 │
│  ├─ @portfolio-grade/app-state (Redux State)               │
│  └─ @portfolio-grade/shared (Utilities)                    │
├─────────────────────────────────────────────────────────────┤
│                    External Services                        │
│  ├─ Portfolio Grade API (NestJS)                           │
│  └─ Browser Storage (Local/Session)                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Environment Configuration

The admin app uses Vite environment variables. Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL="http://localhost:3000/api"

# For Docker e2e tests (optional)
VITE_E2E_API_URL="http://api:3000/api"
```

## 🗄️ Authentication

The admin dashboard uses JWT-based authentication with role-based access control:

### Default Admin Credentials:

- **Email**: `adminA@example.com`
- **Password**: `admin123`
- **Role**: `OrgAdmin`

### Authentication Flow:

1. **Login** → Receive JWT token
2. **Token stored** in Redux store and localStorage
3. **Protected routes** require valid authentication
4. **Role-based access** controls available features

## 🛠️ Available Scripts

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run serve:admin`   | Start admin dashboard in development mode |
| `npm run build:admin`   | Build admin dashboard for production      |
| `npm run test`          | Run unit tests                            |
| `npm run test:watch`    | Run tests in watch mode                   |
| `npm run lint`          | Run ESLint                                |
| `npm run preview:admin` | Preview production build                  |

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests for specific component
npm run test -- --testPathPattern=LoginPage
```

### E2E Tests

```bash
# Run admin e2e tests
npm run admin:e2e:test

# Run e2e tests in headed mode
npm run admin:e2e:test:headed
```

## 📁 Project Structure

```
apps/admin/
├── src/
│   ├── components/            # Reusable components
│   │   ├── header/           # Navigation header
│   │   ├── layout/           # Main layout wrapper
│   │   └── protectedRoute/   # Route protection
│   ├── pages/                # Page components
│   │   ├── dashboard/        # Main dashboard
│   │   ├── loginPage/        # Login form
│   │   ├── adminJobs/        # Background jobs management
│   │   ├── auditLogs/        # System audit logs
│   │   ├── createUser/       # User creation form
│   │   └── createOrganization/ # Organization creation
│   ├── main.tsx              # Application entry point
│   └── test-setup.ts         # Test configuration
├── Dockerfile                # Docker configuration
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
└── jest.config.ts           # Jest test configuration
```

## 🔌 Core Features

### Dashboard (`/`)

- **Welcome screen** with navigation links
- **Quick access** to all admin functions
- **System overview** and status

### Admin Jobs (`/admin-jobs`)

- **Background job management** and monitoring
- **Tag statistics** aggregation
- **Post preview** generation
- **Job queue** status and progress
- **Real-time updates** via API polling

### Audit Logs (`/audit-logs`)

- **System activity** tracking
- **User action** logging
- **Security event** monitoring
- **Compliance** reporting
- **Filterable** log entries

### User Management (`/create-user`)

- **New user** creation
- **Role assignment** (OrgAdmin, Editor, Viewer)
- **Organization** membership
- **Email validation** and uniqueness checks

### Organization Management (`/create-organization`)

- **New organization** creation
- **Multi-tenant** setup
- **Organization** configuration
- **Admin user** assignment

## 🔒 Security Features

### Authentication & Authorization

- **JWT token** validation
- **Role-based** access control
- **Protected routes** with authentication guards
- **Automatic logout** on token expiration

### Route Protection

- **Login required** for all admin pages
- **Role-based** feature access
- **Automatic redirect** to login for unauthorized users
- **Token refresh** handling

### Data Security

- **HTTPS** support in production
- **XSS protection** with React
- **CSRF protection** via API tokens
- **Input validation** on all forms

## 🎨 UI Components

The admin dashboard uses a comprehensive UI component library:

### Form Components

- **Input** fields with validation
- **Button** components with loading states
- **Label** components for accessibility
- **Field** wrappers with error handling

### Layout Components

- **Container** for consistent spacing
- **Layout** wrapper with navigation
- **Header** with user info and logout

### Data Components

- **Table** with sorting and pagination
- **Alert** components for notifications
- **Loading** states and spinners

### Navigation

- **Protected routes** with authentication
- **Role-based** menu items
- **Breadcrumb** navigation
- **Responsive** design

## 🚀 Performance Features

### State Management

- **Redux Toolkit** for predictable state
- **RTK Query** for efficient API calls
- **Optimistic updates** for better UX
- **Caching** of API responses

### Code Splitting

- **Route-based** code splitting
- **Lazy loading** of components
- **Bundle optimization** with Vite
- **Tree shaking** for smaller bundles

### API Integration

- **Axios** for HTTP requests
- **Automatic retry** on failures
- **Request/response** interceptors
- **Error handling** with user feedback

## 🐳 Docker Support

### Build and Run

```bash
# Build admin image
docker build -f apps/admin/Dockerfile -t portfolio-grade-admin .

# Run with Docker Compose
docker-compose up admin
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
NODE_ENV=production
```

## 🔍 API Integration

The admin dashboard integrates with the Portfolio Grade API:

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Admin Endpoints

- `GET /api/admin/jobs/tag-stats` - Tag statistics
- `POST /api/admin/jobs/post-preview/:postId` - Generate post preview
- `GET /api/audit-logs` - System audit logs

### User Management

- `POST /api/users` - Create new user
- `GET /api/users` - List users
- `PUT /api/users/:id` - Update user

### Organization Management

- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List organizations

## 🐛 Troubleshooting

### Common Issues

**1. API Connection Failed:**

```bash
# Check if API server is running
curl http://localhost:3000/api/organizations

# Verify VITE_API_URL in .env
echo $VITE_API_URL
```

**2. Login Issues:**

```bash
# Check if database is seeded
npm run prisma:seed

# Verify admin user exists
# Email: adminA@example.com, Password: admin123
```

**3. Build Errors:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

**4. Test Failures:**

```bash
# Run tests with verbose output
npm run test -- --verbose

# Clear Jest cache
npm run test -- --clearCache
```

### Debug Mode

```bash
# Enable React DevTools
# Install browser extension for React DevTools

# Enable Redux DevTools
# Install browser extension for Redux DevTools

# Enable Vite debug mode
DEBUG=vite:* npm run serve:admin
```

## 📊 State Management

### Redux Store Structure

```typescript
interface RootState {
  auth: {
    token: string | null;
    user: User | null;
    organization: Organization | null;
  };
  api: {
    // RTK Query cache
  };
}
```

### Available Actions

- `setToken(token)` - Set authentication token
- `setUser(user)` - Set current user
- `setOrg(organization)` - Set current organization
- `logout()` - Clear authentication state

### API Mutations

- `useLoginMutation()` - Login user
- `useCreateUserMutation()` - Create new user
- `useCreateOrganizationMutation()` - Create organization

## 🎯 Development Guidelines

### Code Style

- Use **TypeScript** strictly
- Follow **React** best practices
- Use **functional components** with hooks
- Implement **proper error handling**

### Component Structure

```typescript
// Component file structure
ComponentName.tsx; // Main component
ComponentName.spec.tsx; // Unit tests
ComponentName.stories.tsx; // Storybook stories (if applicable)
```

### Testing Standards

- **Unit tests** for all components
- **Integration tests** for page flows
- **E2E tests** for critical user journeys
- **Mock API** calls in tests

## 🤝 Contributing

1. **Follow** the existing code style
2. **Write tests** for new components
3. **Update documentation** as needed
4. **Ensure all tests pass** before submitting

### Development Workflow:

1. **Create feature branch**
2. **Implement feature** with tests
3. **Run tests** and linting
4. **Submit pull request**

---

**Happy coding! 🚀**
