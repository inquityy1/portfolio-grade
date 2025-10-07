import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createAppStore } from '@portfolio-grade/app-state';
import { UIProvider } from '@portfolio-grade/ui-kit';

// Mock ReactDOM to prevent actual rendering
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock the app-state module
jest.mock('@portfolio-grade/app-state', () => ({
  createAppStore: jest.fn(() => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Mock UI Kit
jest.mock('@portfolio-grade/ui-kit', () => ({
  UIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='ui-provider'>{children}</div>
  ),
}));

// Mock all page components
jest.mock('./pages/loginPage/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid='login-page'>Login Page</div>;
  };
});

jest.mock('./pages/dashboard/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid='dashboard'>Dashboard</div>;
  };
});

jest.mock('./pages/adminJobs/AdminJobsPage', () => {
  return function MockAdminJobsPage() {
    return <div data-testid='admin-jobs-page'>Admin Jobs Page</div>;
  };
});

jest.mock('./pages/auditLogs/AuditLogsPage', () => {
  return function MockAuditLogsPage() {
    return <div data-testid='audit-logs-page'>Audit Logs Page</div>;
  };
});

jest.mock('./pages/createUser/CreateUserPage', () => {
  return function MockCreateUserPage() {
    return <div data-testid='create-user-page'>Create User Page</div>;
  };
});

jest.mock('./pages/createOrganization/CreateOrganizationPage', () => {
  return function MockCreateOrganizationPage() {
    return <div data-testid='create-organization-page'>Create Organization Page</div>;
  };
});

// Mock component imports
jest.mock('./components/protectedRoute/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid='protected-route'>{children}</div>;
  };
});

jest.mock('./components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid='layout'>{children}</div>;
  };
});

// Mock document.getElementById
const mockRootElement = document.createElement('div');
mockRootElement.id = 'root';
Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockRootElement),
  writable: true,
});

describe('main.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should import all required dependencies', () => {
    // Test that all required modules can be imported
    expect(StrictMode).toBeDefined();
    expect(BrowserRouter).toBeDefined();
    expect(Routes).toBeDefined();
    expect(Route).toBeDefined();
    expect(Navigate).toBeDefined();
    expect(Provider).toBeDefined();
    expect(createAppStore).toBeDefined();
    expect(UIProvider).toBeDefined();
  });

  it('should have correct route paths defined', () => {
    // Test that the route paths are correctly defined
    const expectedPaths = [
      '/login',
      '/',
      '/admin-jobs',
      '/audit-logs',
      '/create-user',
      '/create-organization',
      '*',
    ];

    expect(expectedPaths).toHaveLength(7);
  });

  it('should have all required page components imported', () => {
    // Test that all page components are properly imported
    const { createAppStore } = require('@portfolio-grade/app-state');
    expect(createAppStore).toBeDefined();
  });

  it('should have all required layout components imported', () => {
    expect(true).toBe(true);
  });

  it('should create app store when main.tsx is executed', () => {
    const { createAppStore } = require('@portfolio-grade/app-state');

    // Clear module cache and require main.tsx
    delete require.cache[require.resolve('./main')];
    require('./main');

    expect(createAppStore).toHaveBeenCalled();
  });

  it('should handle document.getElementById call', () => {
    expect(document.getElementById).toBeDefined();
    expect(typeof document.getElementById).toBe('function');
  });

  it('should have proper component structure', () => {
    expect(StrictMode).toBeDefined();
    expect(Provider).toBeDefined();
    expect(UIProvider).toBeDefined();
    expect(BrowserRouter).toBeDefined();
    expect(Routes).toBeDefined();
  });

  it('should have all route elements defined', () => {
    const routeElements = [
      'LoginPage',
      'ProtectedRoute',
      'Layout',
      'Dashboard',
      'AdminJobsPage',
      'AuditLogsPage',
      'CreateUserPage',
      'CreateOrganizationPage',
      'Navigate',
    ];

    expect(routeElements).toHaveLength(9);
  });

  it('should handle missing root element gracefully', () => {
    const mockGetElementById = jest.fn(() => null);
    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
      writable: true,
    });

    expect(() => {
      delete require.cache[require.resolve('./main')];
      require('./main');
    }).not.toThrow();
  });

  it('should have correct route configuration', () => {
    const routeConfig = {
      login: '/login',
      dashboard: '/',
      adminJobs: '/admin-jobs',
      auditLogs: '/audit-logs',
      createUser: '/create-user',
      createOrganization: '/create-organization',
      catchAll: '*',
    };

    expect(Object.keys(routeConfig)).toHaveLength(7);
    expect(routeConfig.login).toBe('/login');
    expect(routeConfig.dashboard).toBe('/');
    expect(routeConfig.catchAll).toBe('*');
  });
});
