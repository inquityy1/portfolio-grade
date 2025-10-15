import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FormsListPage from './FormsListPage';

// Mock the utility functions
jest.mock('./FormsListPage.utils', () => ({
  fetchForms: jest.fn(),
  fetchUserRoles: jest.fn(),
  hasAdminRights: jest.fn(),
  formatDate: jest.fn(),
}));

// Mock UI kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Container: ({ children, maxWidth, ...props }: any) => (
    <div data-testid='container' {...props}>
      {children}
    </div>
  ),
  LoadingContainer: ({ children }: any) => <div data-testid='loading-container'>{children}</div>,
  ErrorContainer: ({ children, message }: any) => (
    <div data-testid='error-container'>{message || children}</div>
  ),
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div data-testid='card'>{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid='card-header'>{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid='card-title'>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid='card-content'>{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid='card-footer'>{children}</div>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { state: null };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>,
  );
};

describe('FormsListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should show loading state initially', () => {
    const { fetchForms, fetchUserRoles } = require('./FormsListPage.utils');
    fetchForms.mockImplementation(() => new Promise(() => {})); // Never resolves
    fetchUserRoles.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<FormsListPage />);

    expect(screen.getByText('Loading forms...')).toBeInTheDocument();
  });

  it('should render forms list after loading', async () => {
    const {
      fetchForms,
      fetchUserRoles,
      hasAdminRights,
      formatDate,
    } = require('./FormsListPage.utils');
    const mockForms = [
      { id: '1', name: 'Form 1', description: 'Test form', updatedAt: '2023-01-01' },
      { id: '2', name: 'Form 2', description: 'Another form', updatedAt: '2023-01-02' },
    ];
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      memberships: [{ role: 'Editor' }],
    };

    fetchForms.mockResolvedValue(mockForms);
    fetchUserRoles.mockResolvedValue(mockUser);
    hasAdminRights.mockReturnValue(true);
    formatDate.mockReturnValue('1/1/2023');

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Form 1')).toBeInTheDocument();
      expect(screen.getByText('Form 2')).toBeInTheDocument();
      expect(screen.getByText('Create New Form')).toBeInTheDocument();
    });
  });

  it('should show empty state when no forms', async () => {
    const { fetchForms, fetchUserRoles, hasAdminRights } = require('./FormsListPage.utils');

    fetchForms.mockResolvedValue([]);
    fetchUserRoles.mockResolvedValue({ memberships: [{ role: 'Editor' }] });
    hasAdminRights.mockReturnValue(true);

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('Create your first form to get started.')).toBeInTheDocument();
    });
  });

  it('should show flash message when provided', async () => {
    const { fetchForms, fetchUserRoles, hasAdminRights } = require('./FormsListPage.utils');

    fetchForms.mockResolvedValue([]);
    fetchUserRoles.mockResolvedValue({ memberships: [{ role: 'Editor' }] });
    hasAdminRights.mockReturnValue(true);

    // Mock location with flash message
    mockLocation.state = { flash: 'Form created successfully!' };

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Form created successfully!')).toBeInTheDocument();
    });
  });

  it('should hide admin controls for non-admin users', async () => {
    const { fetchForms, fetchUserRoles, hasAdminRights } = require('./FormsListPage.utils');
    const mockForms = [
      { id: '1', name: 'Form 1', description: 'Test form', updatedAt: '2023-01-01' },
    ];

    fetchForms.mockResolvedValue(mockForms);
    fetchUserRoles.mockResolvedValue({ memberships: [{ role: 'Viewer' }] });
    hasAdminRights.mockReturnValue(false);

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(screen.queryByText('Create New Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('should handle loading error', async () => {
    const { fetchForms, fetchUserRoles } = require('./FormsListPage.utils');

    fetchForms.mockRejectedValue({ response: { status: 500 }, message: 'Server error' });
    fetchUserRoles.mockResolvedValue(null);

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should navigate to login on 401/403 error', async () => {
    const { fetchForms } = require('./FormsListPage.utils');

    fetchForms.mockRejectedValue({ response: { status: 401 } });

    renderWithRouter(<FormsListPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});
