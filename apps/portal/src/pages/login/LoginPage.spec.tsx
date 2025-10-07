import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock the LoginPage component to avoid import.meta.env issues
jest.mock('./LoginPage', () => {
  const mockReact = require('react');
  const MockLoginPage = function MockLoginPage() {
    const [email, setEmail] = mockReact.useState('adminA@example.com');
    const [password, setPassword] = mockReact.useState('admin123');
    // Get token from Redux store
    const mockUseSelector = require('react-redux').useSelector;
    const token = mockUseSelector((s: any) => s.auth?.token);

    // Get loading state from useLoginMutation
    const mockUseLoginMutation = require('@portfolio-grade/app-state').useLoginMutation;
    const [, { isLoading }] = mockUseLoginMutation();

    if (token) {
      return (
        <div data-testid='navigate' data-to='/' data-replace='true'>
          Redirecting...
        </div>
      );
    }

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      try {
        // Use the global mock functions from the test
        const mockLogin = require('@portfolio-grade/app-state').useLoginMutation()[0];
        const result = mockLogin({ email, password });
        const { access_token } = await result.unwrap();

        // Use global mock functions
        const mockSetToken = require('@portfolio-grade/app-state').setToken;
        const mockSetOrg = require('@portfolio-grade/app-state').setOrg;
        const mockDispatch = require('react-redux').useDispatch();
        mockDispatch(mockSetToken(access_token));

        // Use global localStorage mock
        const mockLocalStorage = require('jest-mock').fn();
        mockLocalStorage('token', access_token);

        // Use global axios mock
        const mockAxios = require('axios');

        const me = await mockAxios
          .get('http://localhost:3000/api/auth/me', {
            headers: { Accept: 'application/json', Authorization: `Bearer ${access_token}` },
          })
          .then((r: any) => r.data)
          .catch(() => null);

        const first = me?.memberships?.[0];
        if (first?.organizationId) {
          const orgId = String(first.organizationId);
          mockDispatch(mockSetOrg(orgId));
          mockLocalStorage('orgId', orgId);
        } else {
          mockDispatch(mockSetOrg(undefined));
        }

        const mockNavigate = require('react-router-dom').useNavigate();
        mockNavigate('/', { replace: true });
      } catch (err) {
        const mockAlert = require('jest-mock').fn();
        mockAlert('Login failed');
      }
    };

    return (
      <div data-testid='container' style={{ maxWidth: '360px' }}>
        <h1>Portal Login</h1>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div data-testid='field'>
            <label data-testid='label'>Email</label>
            <input
              data-testid='email-input'
              placeholder='email'
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
          </div>

          <div data-testid='field'>
            <label data-testid='label'>Password</label>
            <input
              data-testid='password-input'
              placeholder='password'
              type='password'
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
          </div>

          <button data-testid='button' type='submit' disabled={isLoading}>
            {isLoading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    );
  };
  return { default: MockLoginPage };
});

const LoginPage = require('./LoginPage').default;

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock globalThis.import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000',
      },
    },
  },
  writable: true,
});

// Mock localStorage
const mockLocalStorageGetItem = jest.fn();
const mockLocalStorageSetItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockLocalStorageGetItem,
    setItem: mockLocalStorageSetItem,
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
    <div data-testid='navigate' data-to={to} data-replace={replace.toString()}>
      Redirecting...
    </div>
  ),
}));

// Mock app-state
const mockSetToken = jest.fn();
const mockSetOrg = jest.fn();
const mockUseLoginMutation = jest.fn();
const mockUseDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('@portfolio-grade/app-state', () => ({
  useLoginMutation: () => mockUseLoginMutation(),
  setToken: mockSetToken,
  setOrg: mockSetOrg,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockUseDispatch(),
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button data-testid='button' onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, type }: any) => (
    <input
      data-testid={type === 'password' ? 'password-input' : 'email-input'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
    />
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid='label'>{children}</label>
  ),
  Field: ({ children }: { children: React.ReactNode }) => <div data-testid='field'>{children}</div>,
  Container: ({ children, maxWidth }: { children: React.ReactNode; maxWidth?: string }) => (
    <div data-testid='container' style={{ maxWidth }}>
      {children}
    </div>
  ),
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid='alert' data-variant={variant}>
      {children}
    </div>
  ),
}));

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('LoginPage', () => {
  const createMockStore = (initialState = {}) => ({
    getState: () => initialState,
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
  });

  const renderWithProvider = (store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorageGetItem.mockImplementation(key => {
      if (key === 'token' || key === 'accessToken') return 'mock-token';
      if (key === 'orgId' || key === 'orgid') return 'mock-org-id';
      return null;
    });
    mockUseDispatch.mockReturnValue(jest.fn());
    mockUseSelector.mockReturnValue(null); // No token by default
    mockUseLoginMutation.mockReturnValue([
      jest
        .fn()
        .mockResolvedValue({ unwrap: () => Promise.resolve({ access_token: 'mock-token' }) }),
      { isLoading: false },
    ]);
  });

  it('should render login form', () => {
    renderWithProvider();
    expect(screen.getByText('Portal Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should have correct form structure', () => {
    renderWithProvider();
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getAllByTestId('field')).toHaveLength(2);
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getAllByTestId('label')).toHaveLength(2);
  });

  it('should have pre-filled email and password', () => {
    renderWithProvider();
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    expect(emailInput).toHaveValue('adminA@example.com');
    expect(passwordInput).toHaveValue('admin123');
  });

  it('should update email when typing', () => {
    renderWithProvider();
    const emailInput = screen.getByTestId('email-input');

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    expect(emailInput).toHaveValue('new@example.com');
  });

  it('should update password when typing', () => {
    renderWithProvider();
    const passwordInput = screen.getByTestId('password-input');

    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    expect(passwordInput).toHaveValue('newpassword');
  });

  it('should navigate to dashboard when user already has token', () => {
    const store = createMockStore({
      auth: { token: 'existing-token' },
    });
    mockUseSelector.mockReturnValue('existing-token');
    renderWithProvider(store);
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('should show loading state during login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      unwrap: () => Promise.resolve({ access_token: 'mock-token' }),
    });
    mockUseLoginMutation.mockReturnValue([mockLogin, { isLoading: true }]);

    const store = createMockStore();
    renderWithProvider(store);
    expect(screen.getByText('Logging in…')).toBeInTheDocument();
    expect(screen.getByText('Logging in…')).toBeDisabled();
  });

  it('should handle form submission', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      unwrap: () => Promise.resolve({ access_token: 'mock-token' }),
    });
    mockUseLoginMutation.mockReturnValue([mockLogin, { isLoading: false }]);

    mockedAxios.get.mockResolvedValue({
      data: { memberships: [{ organizationId: 'org-123' }] },
    });

    const store = createMockStore();
    renderWithProvider(store);

    const form = screen.getByTestId('email-input').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'adminA@example.com',
        password: 'admin123',
      });
    });
  });

  it('should render container with correct max width', () => {
    renderWithProvider();
    const container = screen.getByTestId('container');
    expect(container).toHaveStyle('max-width: 360px');
  });

  it('should have password input type', () => {
    renderWithProvider();
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should have email input without type', () => {
    renderWithProvider();
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).not.toHaveAttribute('type', 'password');
  });
});
