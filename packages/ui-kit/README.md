# Portfolio Grade UI Kit

A comprehensive React component library built with TypeScript and Styled Components. This package provides a consistent design system with dark theme support, accessibility features, and responsive components for the Portfolio Grade application ecosystem.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build the package
npm run build

# Start Storybook (if available)
npm run storybook
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **React** (v18 or higher)
- **TypeScript** (v4.5 or higher)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                UI Kit Package (React + Styled Components)   │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Theme System  │  Utilities                │
│  ├─ Buttons  │  ├─ Dark Theme │  ├─ Theme Provider        │
│  ├─ Forms    │  ├─ Colors     │  ├─ Global Styles         │
│  ├─ Layout   │  ├─ Spacing    │  ├─ Type Definitions     │
│  ├─ Cards    │  ├─ Radius     │  └─ Styled Components     │
│  ├─ Tables   │  └─ Typography │                           │
│  └─ Alerts   │               │                           │
├─────────────────────────────────────────────────────────────┤
│                    Used By Applications                     │
│  ├─ Admin Dashboard (React)                                 │
│  ├─ Portal Application (React)                             │
│  └─ Future Applications                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Installation

This package is automatically available to all applications in the monorepo:

```typescript
// In any React app
import { Button, Input, Card, Container, UIProvider } from '@portfolio-grade/ui-kit';
```

## 🎨 Theme System

### Dark Theme

The UI Kit uses a sophisticated dark theme with carefully chosen colors:

```typescript
const theme = {
  colors: {
    bg: '#0b0d12', // Dark background
    text: '#e8eaed', // Light text
    surface: '#1a1d29', // Card/container background
    border: '#2d3748', // Border color
    primary: '#5865f2', // Primary accent color
    error: '#f56565', // Error color
    success: '#48bb78', // Success color
    warning: '#ed8936', // Warning color
  },
  radius: {
    md: '8px', // Medium border radius
    lg: '12px', // Large border radius
  },
  spacing: (n: number) => `${n * 4}px`, // 4px spacing unit
};
```

### Theme Provider

```typescript
import { UIProvider } from '@portfolio-grade/ui-kit';

function App() {
  return (
    <UIProvider>
      <YourApp />
    </UIProvider>
  );
}
```

## 📚 Component Library

### Form Components

#### `Button`

```typescript
import { Button } from '@portfolio-grade/ui-kit';

<Button onClick={handleClick}>Click Me</Button>;
```

**Features:**

- Hover effects with primary color
- Consistent padding and border radius
- Dark theme integration
- TypeScript support

#### `Input`

```typescript
import { Input } from '@portfolio-grade/ui-kit';

<Input type='text' placeholder='Enter text...' value={value} onChange={handleChange} />;
```

**Features:**

- Focus states with primary color
- Box shadow on focus
- Dark theme styling
- Full width with padding

#### `Textarea`

```typescript
import { Textarea } from '@portfolio-grade/ui-kit';

<Textarea placeholder='Enter description...' value={value} onChange={handleChange} />;
```

**Features:**

- Multi-line text input
- Consistent styling with Input
- Dark theme integration

#### `Select`

```typescript
import { Select } from '@portfolio-grade/ui-kit';

<Select value={value} onChange={handleChange}>
  <option value='option1'>Option 1</option>
  <option value='option2'>Option 2</option>
</Select>;
```

**Features:**

- Dropdown selection
- Dark theme styling
- Consistent with other form elements

#### `Checkbox`

```typescript
import { Checkbox } from '@portfolio-grade/ui-kit';

<Checkbox checked={checked} onChange={handleChange} />;
```

**Features:**

- Custom checkbox styling
- Dark theme integration
- Accessibility support

#### `Field`

```typescript
import { Field, Label, Input } from '@portfolio-grade/ui-kit';

<Field>
  <Label htmlFor='email'>Email</Label>
  <Input id='email' type='email' />
</Field>;
```

**Features:**

- Form field wrapper
- Label association
- Error state support
- Consistent spacing

### Layout Components

#### `Container`

```typescript
import { Container } from '@portfolio-grade/ui-kit';

<Container>
  <h1>Page Content</h1>
  <p>Your content here...</p>
</Container>;
```

**Features:**

- Consistent page padding
- Dark theme background
- Responsive design

#### `Card`

```typescript
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@portfolio-grade/ui-kit';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content goes here...</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

**Features:**

- Modular card components
- Consistent spacing
- Dark theme styling
- Flexible layout

### Data Components

#### `Table`

```typescript
import { Table, TableColumn } from '@portfolio-grade/ui-kit';

<Table>
  <thead>
    <tr>
      <TableColumn>Name</TableColumn>
      <TableColumn>Email</TableColumn>
      <TableColumn>Role</TableColumn>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
      <td>Editor</td>
    </tr>
  </tbody>
</Table>;
```

**Features:**

- Styled table components
- Dark theme integration
- Consistent typography
- Responsive design

#### `Alert`

```typescript
import { Alert } from '@portfolio-grade/ui-kit';

<Alert type="error">
  This is an error message
</Alert>

<Alert type="success">
  Operation completed successfully
</Alert>

<Alert type="warning">
  Please review your input
</Alert>
```

**Features:**

- Multiple alert types (error, success, warning)
- Dark theme colors
- Consistent styling
- Accessibility support

### Utility Components

#### `Label`

```typescript
import { Label } from '@portfolio-grade/ui-kit';

<Label htmlFor='input-id'>Field Label</Label>;
```

**Features:**

- Consistent label styling
- Accessibility support
- Dark theme integration

## 🛠️ Available Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run test`       | Run unit tests                  |
| `npm run test:watch` | Run tests in watch mode         |
| `npm run build`      | Build the package               |
| `npm run lint`       | Run ESLint                      |
| `npm run lint:fix`   | Fix ESLint issues               |
| `npm run storybook`  | Start Storybook (if configured) |

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

### Component Testing

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render button text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    screen.getByText('Click Me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📁 Project Structure

```
packages/ui-kit/
├── src/
│   ├── index.ts              # Main export file
│   ├── jest-dom.d.ts         # Jest DOM types
│   ├── test-setup.ts         # Test configuration
│   └── lib/
│       ├── alerts/           # Alert components
│       │   ├── Alert.tsx
│       │   ├── Alert.spec.tsx
│       │   └── Alert.stories.tsx
│       ├── buttons/          # Button components
│       ├── cards/            # Card components
│       ├── checkboxes/       # Checkbox components
│       ├── containers/       # Container components
│       ├── fields/           # Field components
│       ├── inputs/           # Input components
│       ├── labels/           # Label components
│       ├── selects/          # Select components
│       ├── tables/           # Table components
│       ├── textarea/         # Textarea components
│       └── themes/           # Theme system
│           ├── Theme.tsx
│           ├── Theme.spec.tsx
│           └── Theme.stories.tsx
├── package.json              # Package configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.lib.json        # Library build configuration
├── tsconfig.spec.json       # Test configuration
├── tsconfig.storybook.json  # Storybook configuration
└── README.md                # This file
```

## 🔌 Usage Examples

### Complete Form

```typescript
import {
  Container,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Field,
  Label,
  Input,
  Textarea,
  Select,
  Checkbox,
  Button,
  Alert,
} from '@portfolio-grade/ui-kit';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: '',
    newsletter: false,
  });

  return (
    <Container>
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>

          <Field>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </Field>

          <Field>
            <Label htmlFor='category'>Category</Label>
            <Select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value=''>Select a category</option>
              <option value='support'>Support</option>
              <option value='sales'>Sales</option>
              <option value='general'>General</option>
            </Select>
          </Field>

          <Field>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
            />
          </Field>

          <Field>
            <Checkbox
              checked={formData.newsletter}
              onChange={e => setFormData({ ...formData, newsletter: e.target.checked })}
            />
            <Label>Subscribe to newsletter</Label>
          </Field>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </CardFooter>
      </Card>
    </Container>
  );
}
```

### Data Table

```typescript
import { Table, TableColumn, Button, Alert } from '@portfolio-grade/ui-kit';

function UserTable({ users, onEdit, onDelete }) {
  return (
    <>
      {users.length === 0 && <Alert type='warning'>No users found</Alert>}

      <Table>
        <thead>
          <tr>
            <TableColumn>Name</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Role</TableColumn>
            <TableColumn>Actions</TableColumn>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button onClick={() => onEdit(user)}>Edit</Button>
                <Button onClick={() => onDelete(user.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
```

## 🎨 Customization

### Theme Customization

```typescript
import { ThemeProvider } from 'styled-components';
import { theme } from '@portfolio-grade/ui-kit';

const customTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#your-primary-color',
    surface: '#your-surface-color',
  },
};

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Component Styling

```typescript
import styled from 'styled-components';
import { Button } from '@portfolio-grade/ui-kit';

const CustomButton = styled(Button)`
  background: linear-gradient(45deg, #5865f2, #7289da);
  border: none;
  color: white;

  &:hover {
    background: linear-gradient(45deg, #4752c4, #5865f2);
  }
`;
```

## 🔒 Accessibility Features

### ARIA Support

- **Proper labeling** for all form elements
- **Focus management** for keyboard navigation
- **Screen reader** compatibility
- **Color contrast** compliance

### Keyboard Navigation

- **Tab order** for all interactive elements
- **Enter/Space** key support for buttons
- **Arrow keys** for select elements
- **Escape key** for modals and dropdowns

## 🚀 Performance Features

### Tree Shaking

- **ES modules** for optimal tree shaking
- **Named exports** for selective imports
- **Minimal bundle impact** when unused

### Styled Components

- **CSS-in-JS** with styled-components
- **Theme-based** styling
- **Runtime** style generation
- **Server-side rendering** support

## 🐛 Troubleshooting

### Common Issues

**1. Theme Not Applied:**

```typescript
// ✅ Correct: Wrap app with UIProvider
import { UIProvider } from '@portfolio-grade/ui-kit';

function App() {
  return (
    <UIProvider>
      <YourApp />
    </UIProvider>
  );
}

// ❌ Incorrect: Missing theme provider
function App() {
  return <YourApp />; // Components won't have theme
}
```

**2. Styling Issues:**

```typescript
// ✅ Correct: Use theme in styled components
const CustomComponent = styled.div`
  color: ${({ theme }) => theme.colors.text};
`;

// ❌ Incorrect: Hard-coded colors
const CustomComponent = styled.div`
  color: #ffffff; // Won't adapt to theme changes
`;
```

**3. Import Errors:**

```typescript
// ✅ Correct import
import { Button, Input, Card } from '@portfolio-grade/ui-kit';

// ❌ Incorrect import
import Button from '@portfolio-grade/ui-kit/Button';
```

## 🎯 Development Guidelines

### Component Development

- Use **TypeScript** strictly
- Follow **React** best practices
- Implement **accessibility** features
- Write **comprehensive tests**

### Styling Guidelines

- Use **theme values** instead of hard-coded colors
- Follow **consistent spacing** patterns
- Implement **responsive design**
- Ensure **dark theme** compatibility

### Testing Standards

- **Unit tests** for all components
- **Accessibility tests** for interactive elements
- **Visual regression tests** (if Storybook available)
- **Theme testing** for different color schemes

## 🤝 Contributing

1. **Follow** the existing code style
2. **Write tests** for new components
3. **Update Storybook** stories
4. **Ensure accessibility** compliance

### Development Workflow:

1. **Create feature branch**
2. **Implement component** with tests and stories
3. **Run tests** and linting
4. **Submit pull request**

### Component Checklist:

- [ ] TypeScript types defined
- [ ] Unit tests written
- [ ] Storybook story created
- [ ] Accessibility features implemented
- [ ] Dark theme support verified
- [ ] Responsive design tested

---

**Happy coding! 🚀**
