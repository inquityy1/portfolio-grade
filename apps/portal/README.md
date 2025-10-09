# Portfolio Grade Portal

A modern React-based portal application for managing forms, posts, and content creation. Built with TypeScript, Redux Toolkit, and a comprehensive UI component library for content creators and editors.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the API server (required)
npm run serve:api

# Start the portal application
npm run serve:portal
```

The portal will be available at: **http://localhost:4201**

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **API Server** running on http://localhost:3000/api

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Portal Application (React)                  │
├─────────────────────────────────────────────────────────────┤
│  Pages & Components  │  State Management  │  UI Components   │
│  ├─ Dashboard       │  ├─ Redux Store   │  ├─ Forms        │
│  ├─ Login           │  ├─ Auth Slice    │  ├─ Tables      │
│  ├─ Forms List      │  ├─ User Slice    │  ├─ Modals      │
│  ├─ Form Editor     │  └─ API Slice     │  ├─ Cards       │
│  ├─ Posts           │                   │  └─ Layout      │
│  └─ Form Renderer   │                   │                 │
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

The portal app uses Vite environment variables. Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL="http://localhost:3000/api"

# For Docker e2e tests (optional)
VITE_E2E_API_URL="http://api:3000/api"
```

## 🗄️ Authentication

The portal uses JWT-based authentication with role-based access control:

### Default User Credentials:

- **Editor**: `editor@example.com` / `editor123`
- **Viewer**: `viewer@example.com` / `viewer123`
- **OrgAdmin**: `adminA@example.com` / `admin123`

### Authentication Flow:

1. **Login** → Receive JWT token
2. **Token stored** in Redux store and localStorage
3. **Protected routes** require valid authentication
4. **Role-based access** controls available features

## 🛠️ Available Scripts

| Command                  | Description                      |
| ------------------------ | -------------------------------- |
| `npm run serve:portal`   | Start portal in development mode |
| `npm run build:portal`   | Build portal for production      |
| `npm run test`           | Run unit tests                   |
| `npm run test:watch`     | Run tests in watch mode          |
| `npm run lint`           | Run ESLint                       |
| `npm run preview:portal` | Preview production build         |

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests for specific component
npm run test -- --testPathPattern=FormsListPage
```

### E2E Tests

```bash
# Run portal e2e tests
npm run portal:e2e:test

# Run e2e tests in headed mode
npm run portal:e2e:test:headed
```

## 📁 Project Structure

```
apps/portal/
├── src/
│   ├── components/            # Reusable components
│   │   ├── common/           # Common UI components
│   │   │   └── Modal.tsx    # Modal dialog component
│   │   ├── formRenderer/     # Dynamic form rendering
│   │   ├── header/           # Navigation header
│   │   ├── layout/           # Main layout wrapper
│   │   └── protectedRoute/   # Route protection
│   ├── pages/                # Page components
│   │   ├── dashboard/        # Portal dashboard
│   │   ├── login/            # Login form
│   │   ├── forms/            # Form management
│   │   │   ├── FormsListPage.tsx    # Forms listing
│   │   │   ├── FormPage.tsx         # Form details/view
│   │   │   ├── CreateFormPage.tsx   # Create new form
│   │   │   └── EditFormPage.tsx     # Edit existing form
│   │   └── posts/            # Post management
│   │       └── PostsPage.tsx   # Posts listing and management
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
- **Quick access** to all portal functions
- **Content overview** and recent activity
- **Role-based** feature visibility

### Forms Management (`/forms`)

- **Dynamic form creation** with drag-and-drop fields
- **Form field types**: Text input, textarea, select, checkbox
- **Form validation** and configuration
- **Form preview** and testing
- **Form submissions** tracking
- **Form sharing** and public access

### Form Editor (`/forms/:id/edit`)

- **Visual form builder** with field configuration
- **Field ordering** and layout management
- **Validation rules** setup
- **Form settings** and metadata
- **Real-time preview** of form changes

### Posts Management (`/posts`)

- **Content creation** and editing
- **Rich text** support
- **Tag management** and filtering
- **Comment system** for collaboration
- **Post status** management (draft, published)
- **Search and filtering** capabilities

### Form Renderer (`/forms/:id`)

- **Dynamic form rendering** based on configuration
- **Real-time validation** and error handling
- **Form submission** processing
- **Responsive design** for all devices
- **Accessibility** compliance

## 🔒 Security Features

### Authentication & Authorization

- **JWT token** validation
- **Role-based** access control
- **Protected routes** with authentication guards
- **Automatic logout** on token expiration

### Route Protection

- **Login required** for all portal pages
- **Role-based** feature access
- **Automatic redirect** to login for unauthorized users
- **Token refresh** handling

### Data Security

- **HTTPS** support in production
- **XSS protection** with React
- **CSRF protection** via API tokens
- **Input validation** on all forms

## 🎨 UI Components

The portal uses a comprehensive UI component library:

### Form Components

- **Input** fields with validation
- **Textarea** for long text input
- **Select** dropdowns with options
- **Checkbox** for boolean values
- **Button** components with loading states
- **Field** wrappers with error handling

### Layout Components

- **Container** for consistent spacing
- **Layout** wrapper with navigation
- **Header** with user info and logout
- **Modal** for dialogs and overlays

### Data Components

- **Card** components for content display
- **Table** with sorting and pagination
- **Loading** states and spinners
- **Error** handling components

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
# Build portal image
docker build -f apps/portal/Dockerfile -t portfolio-grade-portal .

# Run with Docker Compose
docker-compose up portal
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
NODE_ENV=production
```

## 🔍 API Integration

The portal integrates with the Portfolio Grade API:

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Forms Endpoints

- `GET /api/forms` - List forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/public/forms/:id/submit` - Submit form (public)

### Posts Endpoints

- `GET /api/posts` - List posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Fields Endpoints

- `GET /api/fields` - List form fields
- `POST /api/fields` - Create new field
- `PUT /api/fields/:id` - Update field
- `DELETE /api/fields/:id` - Delete field

## 🎯 Form Builder Features

### Dynamic Form Creation

- **Visual form builder** with drag-and-drop interface
- **Field types**: Text input, textarea, select, checkbox
- **Field configuration** with validation rules
- **Form preview** and testing capabilities
- **Responsive design** for all devices

### Form Field Types

```typescript
type FieldType = 'input' | 'textarea' | 'select' | 'checkbox';

interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  validation?: ValidationRule[];
  options?: string[]; // For select fields
  order?: number;
}
```

### Form Validation

- **Client-side validation** with real-time feedback
- **Server-side validation** for data integrity
- **Custom validation rules** per field
- **Error handling** and user feedback

## 🐛 Troubleshooting

### Common Issues

**1. API Connection Failed:**

```bash
# Check if API server is running
curl http://localhost:3000/api/forms

# Verify VITE_API_URL in .env
echo $VITE_API_URL
```

**2. Login Issues:**

```bash
# Check if database is seeded
npm run prisma:seed

# Verify user exists
# Email: editor@example.com, Password: editor123
```

**3. Form Rendering Issues:**

```bash
# Check form configuration
# Verify field types and validation rules
# Check API response format
```

**4. Build Errors:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

**5. Test Failures:**

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
DEBUG=vite:* npm run serve:portal
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
- `useCreateFormMutation()` - Create new form
- `useUpdateFormMutation()` - Update form
- `useCreatePostMutation()` - Create new post

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

### Form Development

- **Use FormRenderer** for dynamic forms
- **Implement validation** on both client and server
- **Handle errors** gracefully with user feedback
- **Test form submissions** thoroughly

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

### Form Development Guidelines:

- **Use TypeScript** for all form configurations
- **Implement proper validation** for all field types
- **Test form rendering** with various configurations
- **Ensure accessibility** compliance

---

**Happy coding! 🚀**
