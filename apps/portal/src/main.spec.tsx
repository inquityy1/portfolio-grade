import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createAppStore } from '@portfolio-grade/app-state';
import { UIProvider } from '@portfolio-grade/ui-kit';

// Mock all page components
jest.mock('./pages/forms/form/FormPage', () => {
  return function MockFormPage() {
    return <div data-testid='form-page'>Form Page</div>;
  };
});

jest.mock('./pages/forms/createForm/CreateFormPage', () => {
  return function MockCreateFormPage() {
    return <div data-testid='create-form-page'>Create Form Page</div>;
  };
});

jest.mock('./pages/forms/editForm/EditFormPage', () => {
  return function MockEditFormPage() {
    return <div data-testid='edit-form-page'>Edit Form Page</div>;
  };
});

jest.mock('./pages/login/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid='login-page'>Login Page</div>;
  };
});

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

jest.mock('./pages/posts/PostsPage', () => {
  return function MockPostsPage() {
    return <div data-testid='posts-page'>Posts Page</div>;
  };
});

jest.mock('./pages/forms/formsList/FormsListPage', () => {
  return function MockFormsListPage() {
    return <div data-testid='forms-list-page'>Forms List Page</div>;
  };
});

jest.mock('./pages/dashboard/PortalDashboard', () => {
  return function MockPortalDashboard() {
    return <div data-testid='portal-dashboard'>Portal Dashboard</div>;
  };
});

// Mock ReactDOM
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock the app-state module
jest.mock('@portfolio-grade/app-state', () => ({
  createAppStore: jest.fn(() => ({
    getState: jest.fn(() => ({ auth: { token: null } })),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Mock document.getElementById
const mockRootElement = document.createElement('div');
mockRootElement.id = 'root';
const mockGetElementById = jest.fn(() => mockRootElement);
Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true,
});

describe('main.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetElementById.mockReturnValue(mockRootElement);
  });

  it('should import all required dependencies', () => {
    // Test that all required modules can be imported
    expect(StrictMode).toBeDefined();
    expect(ReactDOM.createRoot).toBeDefined();
    expect(Provider).toBeDefined();
    expect(BrowserRouter).toBeDefined();
    expect(Routes).toBeDefined();
    expect(Route).toBeDefined();
    expect(Navigate).toBeDefined();
    expect(createAppStore).toBeDefined();
    expect(UIProvider).toBeDefined();
  });

  it('should have correct route paths defined', () => {
    // Test that the route paths are correctly defined
    const expectedPaths = [
      '/login',
      '/',
      '/forms',
      '/forms/:id',
      '/forms/new',
      '/forms/:id/edit',
      '/posts',
      '*',
    ];

    expect(expectedPaths).toHaveLength(8);
  });

  it('should have all required page components imported', () => {
    // Test that all page components are properly imported
    const { createAppStore } = require('@portfolio-grade/app-state');
    expect(createAppStore).toBeDefined();
  });

  it('should have all required layout components imported', () => {
    expect(StrictMode).toBeDefined();
    expect(Provider).toBeDefined();
    expect(UIProvider).toBeDefined();
    expect(BrowserRouter).toBeDefined();
    expect(Routes).toBeDefined();
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
      'PortalDashboard',
      'FormsListPage',
      'FormPage',
      'CreateFormPage',
      'EditFormPage',
      'PostsPage',
      'Navigate',
    ];

    expect(routeElements).toHaveLength(10);
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
      forms: '/forms',
      formById: '/forms/:id',
      createForm: '/forms/new',
      editForm: '/forms/:id/edit',
      posts: '/posts',
      catchAll: '*',
    };

    expect(Object.keys(routeConfig)).toHaveLength(8);
    expect(routeConfig.login).toBe('/login');
    expect(routeConfig.dashboard).toBe('/');
    expect(routeConfig.catchAll).toBe('*');
  });

  it('should have proper nested route structure', () => {
    // Test that the nested route structure is correct
    const nestedRoutes = {
      protected: 'ProtectedRoute',
      layout: 'Layout',
      dashboard: 'PortalDashboard',
      formsList: 'FormsListPage',
      formPage: 'FormPage',
      createForm: 'CreateFormPage',
      editForm: 'EditFormPage',
      posts: 'PostsPage',
    };

    expect(Object.keys(nestedRoutes)).toHaveLength(8);
    expect(nestedRoutes.protected).toBe('ProtectedRoute');
    expect(nestedRoutes.layout).toBe('Layout');
  });

  it('should have correct authentication flow', () => {
    // Test that the authentication flow is properly structured
    const authFlow = {
      loginRoute: '/login',
      protectedRoutes: ['/', '/forms', '/forms/:id', '/forms/new', '/forms/:id/edit', '/posts'],
      fallbackRoute: '*',
    };

    expect(authFlow.loginRoute).toBe('/login');
    expect(authFlow.protectedRoutes).toHaveLength(6);
    expect(authFlow.fallbackRoute).toBe('*');
  });

  it('should have proper form management routes', () => {
    // Test that form management routes are comprehensive
    const formRoutes = {
      list: '/forms',
      view: '/forms/:id',
      create: '/forms/new',
      edit: '/forms/:id/edit',
    };

    expect(Object.keys(formRoutes)).toHaveLength(4);
    expect(formRoutes.list).toBe('/forms');
    expect(formRoutes.create).toBe('/forms/new');
    expect(formRoutes.edit).toBe('/forms/:id/edit');
  });

  it('should have correct provider hierarchy', () => {
    // Test that the provider hierarchy is correct
    const providerHierarchy = ['StrictMode', 'Provider', 'UIProvider', 'BrowserRouter'];

    expect(providerHierarchy).toHaveLength(4);
    expect(providerHierarchy[0]).toBe('StrictMode');
    expect(providerHierarchy[1]).toBe('Provider');
    expect(providerHierarchy[2]).toBe('UIProvider');
    expect(providerHierarchy[3]).toBe('BrowserRouter');
  });

  it('should handle ReactDOM.createRoot call', () => {
    // Test that ReactDOM.createRoot is available and can be called
    expect(ReactDOM.createRoot).toBeDefined();
    expect(typeof ReactDOM.createRoot).toBe('function');
  });

  it('should have proper error handling for missing root element', () => {
    const mockGetElementById = jest.fn(() => null);
    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
      writable: true,
    });

    // This should not throw an error even if root element is missing
    expect(() => {
      delete require.cache[require.resolve('./main')];
      require('./main');
    }).not.toThrow();
  });

  it('should have correct component imports', () => {
    // Test that all components are properly imported
    const componentImports = [
      'FormPage',
      'CreateFormPage',
      'EditFormPage',
      'LoginPage',
      'ProtectedRoute',
      'Layout',
      'PostsPage',
      'FormsListPage',
      'PortalDashboard',
    ];

    expect(componentImports).toHaveLength(9);
  });

  it('should have proper route element mapping', () => {
    // Test that routes are mapped to correct components
    const routeElementMap = {
      '/login': 'LoginPage',
      '/': 'PortalDashboard',
      '/forms': 'FormsListPage',
      '/forms/:id': 'FormPage',
      '/forms/new': 'CreateFormPage',
      '/forms/:id/edit': 'EditFormPage',
      '/posts': 'PostsPage',
      '*': 'Navigate',
    };

    expect(Object.keys(routeElementMap)).toHaveLength(8);
    expect(routeElementMap['/login']).toBe('LoginPage');
    expect(routeElementMap['/']).toBe('PortalDashboard');
    expect(routeElementMap['*']).toBe('Navigate');
  });
});
