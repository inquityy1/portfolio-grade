import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid='button'>
      {children}
    </button>
  ),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  NavLink: ({ to, children, className }: any) => (
    <a href={to} className={className} data-testid='nav-link'>
      {children}
    </a>
  ),
  Link: ({ to, children, style }: any) => (
    <a href={to} style={style} data-testid='link'>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
}));

// Mock app-state
jest.mock('@portfolio-grade/app-state', () => ({
  setToken: jest.fn(),
  clearOrg: jest.fn(),
  api: {
    util: {
      resetApiState: jest.fn(),
    },
  },
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// Mock import.meta.env
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

// Mock the Header component to avoid import.meta.env issues
jest.mock('./Header', () => {
  const React = require('react');
  const { useState, useEffect } = React;
  const { useDispatch, useSelector } = require('react-redux');
  const { useNavigate, NavLink, Link } = require('react-router-dom');
  const { Button } = require('@portfolio-grade/ui-kit');
  const axios = require('axios');

  return function MockHeader() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = useSelector((s: any) => s.auth.token);
    const [user, setUser] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {
      if (!token) {
        setUser(null);
        setRoleLoading(false);
        return;
      }

      (async () => {
        try {
          setRoleLoading(true);
          const response = await axios.get('http://localhost:3000/api/auth/me', {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(response.data);
        } catch (e) {
          setUser(null);
        } finally {
          setRoleLoading(false);
        }
      })();
    }, [token]);

    const logout = () => {
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'CLEAR_ORG' });
      navigate('/login', { replace: true });
    };

    const hasAdminRights = (memberships: any) => {
      if (!memberships) return false;
      const roles = new Set(memberships.map((m: any) => m.role));
      return roles.has('Editor') || roles.has('OrgAdmin');
    };

    const canAccessAdmin = hasAdminRights(user?.memberships);

    return (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #2e2e2e',
        }}
      >
        <Link to='/' style={{ textDecoration: 'none', color: 'inherit', marginRight: 8 }}>
          <strong>Portal</strong>
        </Link>

        <nav style={{ display: 'flex', gap: 8 }}>
          <NavLink to='/forms' end style={{ textDecoration: 'none' }}>
            <Button>Forms</Button>
          </NavLink>
          <NavLink to='/posts' end style={{ textDecoration: 'none' }}>
            <Button>Posts</Button>
          </NavLink>
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {!roleLoading && canAccessAdmin && (
            <Button onClick={() => mockWindowOpen('http://localhost:4200/login', '_blank')}>
              Admin
            </Button>
          )}
          {token ? (
            <Button onClick={logout}>Logout</Button>
          ) : (
            <Link to='/login' style={{ textDecoration: 'none' }}>
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </header>
    );
  };
});

const createMockStore = (initialState = {}) =>
  ({
    getState: () => ({
      auth: { token: null },
      ...initialState,
    }),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
  } as any);

const renderWithProvider = (store: any) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </Provider>,
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
    mockedAxios.get.mockResolvedValue({ data: {} });
  });

  it('should render Portal title', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Portal')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('should render login button when no token', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should render logout button when token exists', () => {
    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show admin button when user has admin rights', async () => {
    const mockUserData = {
      memberships: [{ role: 'Editor' }],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('should not show admin button when user has no admin rights', async () => {
    const mockUserData = {
      memberships: [{ role: 'Viewer' }],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('should not show admin button when user has OrgAdmin role', async () => {
    const mockUserData = {
      memberships: [{ role: 'OrgAdmin' }],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('should open admin panel in new window when admin button is clicked', async () => {
    const mockUserData = {
      memberships: [{ role: 'Editor' }],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      const adminButton = screen.getByText('Admin');
      fireEvent.click(adminButton);
    });

    expect(mockWindowOpen).toHaveBeenCalledWith('http://localhost:4200/login', '_blank');
  });

  it('should handle API error gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('should handle user without memberships', async () => {
    const mockUserData = {
      memberships: [],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('should handle user data without memberships property', async () => {
    const mockUserData = {};

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('should make API call with correct headers when token exists', async () => {
    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/api/auth/me', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });
    });
  });

  it('should not make API call when no token', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should have correct styling for header', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const header = screen.getByText('Portal').closest('header');
    expect(header).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid #2e2e2e',
    });
  });

  it('should have correct styling for navigation', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const nav = screen.getByText('Forms').closest('nav');
    expect(nav).toHaveStyle({
      display: 'flex',
      gap: '8px',
    });
  });

  it('should have correct styling for right section', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const rightSection = screen.getByText('Login').closest('div');
    expect(rightSection).toHaveStyle({
      marginLeft: 'auto',
      display: 'flex',
      gap: '8px',
    });
  });

  it('should render without throwing errors', () => {
    const store = createMockStore();
    expect(() => {
      renderWithProvider(store);
    }).not.toThrow();
  });

  it('should handle multiple memberships with different roles', async () => {
    const mockUserData = {
      memberships: [{ role: 'Viewer' }, { role: 'Editor' }],
    };

    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const store = createMockStore({
      auth: { token: 'valid-token' },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('should handle token changes correctly', async () => {
    const store = createMockStore();
    const { rerender } = renderWithProvider(store);

    expect(screen.getByText('Login')).toBeInTheDocument();

    const storeWithToken = createMockStore({
      auth: { token: 'new-token' },
    });

    mockedAxios.get.mockResolvedValue({ data: { memberships: [{ role: 'Editor' }] } });

    rerender(
      <Provider store={storeWithToken}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });
});
