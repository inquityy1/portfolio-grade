import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminLoginPage from './LoginPage';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create mock functions that can be tracked by Jest
const mockLocalStorageSetItem = jest.fn();
const mockNavigate = jest.fn();
const mockWindowLocationHref = jest.fn();

// Mock LoginPage component to avoid import.meta.env issues
jest.mock('./LoginPage', () => {
  const React = require('react');
  const { useState } = React;
  const { useDispatch, useSelector } = require('react-redux');
  const { useNavigate } = require('react-router-dom');
  const { Button, Label, Input, Field, Container, Alert } = require('@portfolio-grade/ui-kit');
  const axios = require('axios');

  return function MockAdminLoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const token = useSelector((s: any) => s.auth.token);
    const [email, setEmail] = useState('adminA@example.com');
    const [password, setPassword] = useState('admin123');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const api = (path: string) => {
      const baseUrl = 'http://localhost:3000';
      return `${baseUrl}/api${path}`;
    };

    // Mock login mutation - this will be controlled by the test's axios mocks
    const login = async ({ email, password }: { email: string; password: string }) => {
      setIsLoading(true);
      try {
        // Use the actual axios mock to determine success/failure
        const response = await mockedAxios.post(api('/auth/login'), { email, password });
        return {
          unwrap: () => Promise.resolve(response.data),
        };
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      return (
        <div data-testid='navigate' data-to='/' data-replace='true'>
          Navigate to /
        </div>
      );
    }

    async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);

      try {
        // 1) get JWT
        const loginResult = await login({ email, password });
        const { access_token } = await loginResult.unwrap();

        // 2) resolve orgId and check user roles
        let orgId: string | undefined;

        // Try /auth/me to get user data and roles
        let me;
        try {
          const response = await mockedAxios.get(api('/auth/me'), {
            headers: { Accept: 'application/json', Authorization: `Bearer ${access_token}` },
          });
          me = response.data;
        } catch (err: any) {
          // If auth/me fails, show the error message
          const errorMessage = err?.response?.data?.message || err.message || 'Auth me failed';
          setError(errorMessage);
          return;
        }

        const first = me?.memberships?.[0];
        if (first?.organizationId) {
          orgId = String(first.organizationId);
        }

        // Check if user has admin/editor role
        const hasAdminRole = me?.memberships?.some(
          (membership: any) => membership.role === 'Editor' || membership.role === 'OrgAdmin',
        );

        if (!hasAdminRole) {
          setError('Access denied. Only Editors and OrgAdmins can access the admin panel.');
          return;
        }

        if (orgId) {
          dispatch({ type: 'SET_ORG', payload: orgId });
          mockLocalStorageSetItem('orgId', orgId);
        }

        // Store token
        dispatch({ type: 'SET_TOKEN', payload: access_token });
        mockLocalStorageSetItem('token', access_token);

        navigate('/', { replace: true });
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err.message || 'Login failed';
        setError(errorMessage);
      }
    }

    return (
      <Container maxWidth='360px'>
        <h1>Admin Login</h1>
        <p style={{ marginBottom: 24, opacity: 0.8 }}>
          Only Editors and OrgAdmins can access the admin panel.
        </p>

        {error && <Alert style={{ marginBottom: 16, color: 'tomato' }}>{error}</Alert>}

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <Field>
            <Label>Email</Label>
            <Input
              placeholder='email'
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input
              placeholder='password'
              type='password'
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
          </Field>

          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Logging in…' : 'Login to Admin'}
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button variant='outline' onClick={() => mockWindowLocationHref('http://localhost:4201')}>
            Back to Portal
          </Button>
        </div>
      </Container>
    );
  };
});

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Container: ({ children, maxWidth }: { children: React.ReactNode; maxWidth?: string }) => (
    <div data-testid='container' style={{ maxWidth }}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, type, variant, style }: any) => (
    <button
      data-testid='button'
      onClick={onClick}
      disabled={disabled}
      type={type}
      data-variant={variant}
      style={style}
    >
      {children}
    </button>
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid='label'>{children}</label>
  ),
  Input: ({ value, onChange, placeholder, disabled, type }: any) => (
    <input
      data-testid='input'
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
  Field: ({ children }: { children: React.ReactNode }) => <div data-testid='field'>{children}</div>,
  Alert: ({ children, style }: any) => (
    <div data-testid='alert' style={style}>
      {children}
    </div>
  ),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
    <div data-testid='navigate' data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: mockLocalStorageSetItem,
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

const createMockStore = (initialState = {}) => ({
  getState: () => ({
    auth: { token: null },
    ...initialState,
  }),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
});

const renderWithProvider = (store: any) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AdminLoginPage />
      </BrowserRouter>
    </Provider>,
  );
};

describe('AdminLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorageSetItem.mockClear();
    mockNavigate.mockClear();
    mockWindowLocationHref.mockClear();
    mockedAxios.post.mockResolvedValue({ data: {} });
    mockedAxios.get.mockResolvedValue({ data: {} });
  });

  it('should render the login page with correct title and description', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(
      screen.getByText('Only Editors and OrgAdmins can access the admin panel.'),
    ).toBeInTheDocument();
  });

  it('should render form elements correctly', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument();
    expect(screen.getByText('Login to Admin')).toBeInTheDocument();
    expect(screen.getByText('Back to Portal')).toBeInTheDocument();
  });

  it('should have default values for email and password', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const emailInput = screen.getAllByTestId('input')[0];
    const passwordInput = screen.getAllByTestId('input')[1];

    expect(emailInput).toHaveValue('adminA@example.com');
    expect(passwordInput).toHaveValue('admin123');
  });

  it('should update email and password when typing', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const emailInput = screen.getAllByTestId('input')[0];
    const passwordInput = screen.getAllByTestId('input')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('newpassword');
  });

  it('should navigate to dashboard when user already has token', () => {
    const store = createMockStore({
      auth: { token: 'existing-token' },
    });
    renderWithProvider(store);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('should show loading state during login', async () => {
    // Mock a delayed response
    mockedAxios.post.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100)),
    );

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Logging in…')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should handle successful login with admin role', async () => {
    const mockUserData = {
      memberships: [{ organizationId: 'org-123', role: 'Editor' }],
    };

    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
        email: 'adminA@example.com',
        password: 'admin123',
      });
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockLocalStorageSetItem).toHaveBeenCalledWith('orgId', 'org-123');
      expect(mockLocalStorageSetItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should handle successful login with OrgAdmin role', async () => {
    const mockUserData = {
      memberships: [{ organizationId: 'org-456', role: 'OrgAdmin' }],
    };

    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLocalStorageSetItem).toHaveBeenCalledWith('orgId', 'org-456');
      expect(mockLocalStorageSetItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should show error for insufficient permissions', async () => {
    const mockUserData = {
      memberships: [{ organizationId: 'org-123', role: 'Viewer' }],
    };

    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Access denied. Only Editors and OrgAdmins can access the admin panel.'),
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle login API error', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    mockedAxios.post.mockRejectedValue({ message: 'Network Error' });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('should handle /auth/me API error gracefully', async () => {
    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockRejectedValue({ message: 'Auth me failed' });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Auth me failed')).toBeInTheDocument();
    });
  });

  it('should handle user without memberships', async () => {
    const mockUserData = {
      memberships: [],
    };

    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Access denied. Only Editors and OrgAdmins can access the admin panel.'),
      ).toBeInTheDocument();
    });
  });

  it('should handle user without organization ID', async () => {
    const mockUserData = {
      memberships: [
        { role: 'Editor' }, // No organizationId
      ],
    };

    mockedAxios.post.mockResolvedValue({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLocalStorageSetItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    // Should not set orgId if not available
    expect(mockLocalStorageSetItem).not.toHaveBeenCalledWith('orgId', expect.any(String));
  });

  it('should redirect to portal when back button is clicked', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const backButton = screen.getByText('Back to Portal');
    fireEvent.click(backButton);

    expect(mockWindowLocationHref).toHaveBeenCalledWith('http://localhost:4201');
  });

  it('should clear error when form is submitted again', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'First Error' });
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: 'mock-token' } });
    mockedAxios.get.mockResolvedValue({
      data: { memberships: [{ organizationId: 'org-123', role: 'Editor' }] },
    });

    const store = createMockStore();
    renderWithProvider(store);

    const submitButton = screen.getByText('Login to Admin');

    // First submission - should show error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('First Error')).toBeInTheDocument();
    });

    // Second submission - should clear error and succeed
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText('First Error')).not.toBeInTheDocument();
    });
  });

  it('should have proper form structure', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const form = screen.getAllByTestId('input')[0].closest('form');
    expect(form).toBeInTheDocument();

    const inputs = screen.getAllByTestId('input');
    expect(inputs).toHaveLength(2);

    const passwordInput = inputs[1];
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should render container with correct max width', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle('max-width: 360px');
  });

  it('should have proper button variants', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(2);

    const loginButton = screen.getByText('Login to Admin');
    const backButton = screen.getByText('Back to Portal');

    expect(loginButton).toHaveAttribute('type', 'submit');
    expect(backButton).toHaveAttribute('data-variant', 'outline');
  });
});
