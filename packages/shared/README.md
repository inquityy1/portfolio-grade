# Portfolio Grade Shared Package

A TypeScript library containing shared types, utilities, and constants used across the Portfolio Grade application ecosystem. This package provides common functionality for role-based access control, type definitions, and utility functions.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build the package
npm run build
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **TypeScript** (v4.5 or higher)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Shared Package (TypeScript)                 │
├─────────────────────────────────────────────────────────────┤
│  Core Exports  │  Type Definitions  │  Utility Functions   │
│  ├─ Role Types │  ├─ Role           │  ├─ hasRoleLevel     │
│  ├─ Constants  │  ├─ Role Hierarchy │  ├─ getAllRoles      │
│  └─ Functions  │  └─ Type Guards    │  └─ Role Validation │
├─────────────────────────────────────────────────────────────┤
│                    Used By Applications                     │
│  ├─ API Server (NestJS)                                     │
│  ├─ Admin Dashboard (React)                                 │
│  ├─ Portal Application (React)                             │
│  └─ E2E Tests (Playwright)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Installation

This package is automatically available to all applications in the monorepo:

```typescript
// In any app or package
import { Role, hasRoleLevel, getAllRoles, ROLE_HIERARCHY } from '@portfolio-grade/shared';
```

## 📚 API Reference

### Types

#### `Role`

```typescript
type Role = 'OrgAdmin' | 'Editor' | 'Viewer';
```

Defines the three user roles in the system:

- **OrgAdmin**: Full administrative access to organization
- **Editor**: Can create, edit, and delete content
- **Viewer**: Read-only access to content

### Constants

#### `ROLE_HIERARCHY`

```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  OrgAdmin: 3,
  Editor: 2,
  Viewer: 1,
} as const;
```

Role hierarchy mapping where higher numbers indicate more permissions.

### Functions

#### `hasRoleLevel(userRole: Role, requiredRole: Role): boolean`

```typescript
// Check if user has sufficient permissions
const canEdit = hasRoleLevel('Editor', 'Editor'); // true
const canAdmin = hasRoleLevel('Editor', 'OrgAdmin'); // false
const canView = hasRoleLevel('Viewer', 'Viewer'); // true
```

Checks if a user has sufficient role level to perform an action.

#### `getAllRoles(): Role[]`

```typescript
// Get all available roles
const roles = getAllRoles(); // ['OrgAdmin', 'Editor', 'Viewer']
```

Returns an array of all available roles in the system.

## 🛠️ Available Scripts

| Command              | Description             |
| -------------------- | ----------------------- |
| `npm run test`       | Run unit tests          |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build`      | Build the package       |
| `npm run lint`       | Run ESLint              |
| `npm run lint:fix`   | Fix ESLint issues       |

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### Test Structure

```typescript
// Example test
describe('hasRoleLevel', () => {
  it('should return true for equal roles', () => {
    expect(hasRoleLevel('Editor', 'Editor')).toBe(true);
  });

  it('should return true for higher role', () => {
    expect(hasRoleLevel('OrgAdmin', 'Editor')).toBe(true);
  });

  it('should return false for lower role', () => {
    expect(hasRoleLevel('Viewer', 'Editor')).toBe(false);
  });
});
```

## 📁 Project Structure

```
packages/shared/
├── src/
│   ├── index.ts              # Main export file
│   └── lib/
│       ├── types.ts          # Type definitions and utilities
│       └── types.spec.ts     # Unit tests
├── package.json              # Package configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.lib.json        # Library build configuration
├── tsconfig.spec.json       # Test configuration
├── jest.config.ts           # Jest test configuration
└── README.md                # This file
```

## 🔌 Usage Examples

### Role-Based Access Control

```typescript
import { Role, hasRoleLevel, getAllRoles } from '@portfolio-grade/shared';

// In API Guard
function canAccessAdminPanel(userRole: Role): boolean {
  return hasRoleLevel(userRole, 'OrgAdmin');
}

// In React Component
function AdminButton({ userRole }: { userRole: Role }) {
  if (!hasRoleLevel(userRole, 'OrgAdmin')) {
    return null;
  }

  return <button>Admin Panel</button>;
}

// In Form Validation
function canEditForm(userRole: Role): boolean {
  return hasRoleLevel(userRole, 'Editor');
}
```

### Role Selection

```typescript
import { getAllRoles, Role } from '@portfolio-grade/shared';

function RoleSelector({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  const roles = getAllRoles();

  return (
    <select onChange={e => onRoleChange(e.target.value as Role)}>
      {roles.map(role => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
```

### Permission Checking

```typescript
import { Role, ROLE_HIERARCHY } from '@portfolio-grade/shared';

function getPermissionLevel(role: Role): number {
  return ROLE_HIERARCHY[role];
}

function canPerformAction(userRole: Role, actionRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[actionRole];
}
```

## 🔒 Security Considerations

### Role Validation

- **Always validate roles** on both client and server
- **Use server-side validation** as the source of truth
- **Implement proper authorization** checks in API endpoints

### Best Practices

```typescript
// ✅ Good: Server-side validation
@UseGuards(RolesGuard)
@Roles('OrgAdmin')
@Get('/admin/users')
async getUsers() {
  // Only OrgAdmin can access
}

// ✅ Good: Client-side UI control
function AdminPanel({ userRole }: { userRole: Role }) {
  if (!hasRoleLevel(userRole, 'OrgAdmin')) {
    return <AccessDenied />;
  }
  return <AdminContent />;
}

// ❌ Bad: Client-side only validation
function BadExample({ userRole }: { userRole: Role }) {
  // This is just UI control, not security
  if (userRole === 'OrgAdmin') {
    return <AdminContent />;
  }
}
```

## 🚀 Performance Features

### Tree Shaking

- **ES modules** for optimal tree shaking
- **Named exports** for selective imports
- **Minimal bundle impact** when unused

### Type Safety

- **Strict TypeScript** configuration
- **Compile-time** role validation
- **IntelliSense** support for all functions

## 🐛 Troubleshooting

### Common Issues

**1. Type Import Errors:**

```typescript
// ✅ Correct import
import { Role, hasRoleLevel } from '@portfolio-grade/shared';

// ❌ Incorrect import
import { Role } from '@portfolio-grade/shared/types';
```

**2. Role Comparison Issues:**

```typescript
// ✅ Correct usage
const canEdit = hasRoleLevel(userRole, 'Editor');

// ❌ Incorrect usage
const canEdit = userRole === 'Editor' || userRole === 'OrgAdmin';
```

**3. Build Errors:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild the package
npm run build
```

## 🎯 Development Guidelines

### Code Style

- Use **TypeScript** strictly
- Follow **functional programming** principles
- Implement **pure functions** without side effects
- Use **descriptive naming** for all exports

### Testing Standards

- **Unit tests** for all functions
- **Type tests** for type definitions
- **Edge case** coverage
- **Documentation** in test descriptions

### Adding New Features

```typescript
// 1. Define types
export type NewFeature = 'option1' | 'option2';

// 2. Add constants
export const NEW_FEATURE_CONFIG = {
  option1: { value: 1 },
  option2: { value: 2 },
} as const;

// 3. Implement utilities
export function processNewFeature(feature: NewFeature): boolean {
  return NEW_FEATURE_CONFIG[feature].value > 0;
}

// 4. Write tests
describe('processNewFeature', () => {
  it('should process feature correctly', () => {
    expect(processNewFeature('option1')).toBe(true);
  });
});
```

## 🤝 Contributing

1. **Follow** the existing code style
2. **Write tests** for new functions
3. **Update documentation** as needed
4. **Ensure all tests pass** before submitting

### Development Workflow:

1. **Create feature branch**
2. **Implement feature** with tests
3. **Run tests** and linting
4. **Submit pull request**

---

**Happy coding! 🚀**
