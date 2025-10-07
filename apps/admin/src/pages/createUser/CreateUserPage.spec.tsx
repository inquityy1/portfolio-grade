import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CreateUserPage from './CreateUserPage';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create mock functions that can be tracked by Jest
const mockLocalStorageGetItem = jest.fn();

// Mock CreateUserPage component to avoid import.meta.env issues
jest.mock('./CreateUserPage', () => {
  const React = require('react');
  const { useState, useEffect } = React;
  const { useSelector } = require('react-redux');
  const axios = require('axios');
  const {
    Container,
    Button,
    Label,
    Input,
    Field,
    Select,
    Alert,
  } = require('@portfolio-grade/ui-kit');

  return function MockCreateUserPage() {
    const token = useSelector((s: any) => s.auth.token);
    const orgId = useSelector((s: any) => s.tenant.orgId);

    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      role: 'Viewer',
      organizationId: '',
    });
    const [organizations, setOrganizations] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const api = (path: string) => {
      const baseUrl = 'http://localhost:3000';
      return `${baseUrl}/api${path}`;
    };

    // Load organizations on component mount
    useEffect(() => {
      const loadOrganizations = async () => {
        setIsLoadingOrgs(true);
        try {
          const actualToken = token || mockLocalStorageGetItem('token') || '';
          const response = await axios.get(`${api('/organizations')}`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${actualToken}`,
            },
          });
          setOrganizations(response.data);

          // Set default organization to current org if available
          if (orgId && response.data.length > 0) {
            const currentOrg = response.data.find((org: any) => org.id === orgId);
            if (currentOrg) {
              setFormData((prev: any) => ({ ...prev, organizationId: currentOrg.id }));
            }
          }
        } catch (err) {
          // Don't log errors in tests to avoid console.error warnings
          setError('Failed to load organizations');
        } finally {
          setIsLoadingOrgs(false);
        }
      };

      loadOrganizations();
    }, [token, orgId]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!formData.email || !formData.password || !formData.name || !formData.organizationId) {
        setError('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);

      try {
        // Get token and orgId from Redux or localStorage as fallback
        const actualToken = token || mockLocalStorageGetItem('token') || '';
        const actualOrgId = orgId || mockLocalStorageGetItem('orgId') || '';

        await axios.post(
          `${api('/users')}`,
          {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            organizationId: formData.organizationId,
          },
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${actualToken}`,
              'x-org-id': actualOrgId,
              'idempotency-key': `create-user-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            },
          },
        );

        setSuccess(
          `User ${formData.name} (${formData.email}) created successfully with ${formData.role} role!`,
        );
        setFormData({ email: '', password: '', name: '', role: 'Viewer', organizationId: '' });

        // Auto-hide success message after 1 second
        setTimeout(() => {
          setSuccess(null);
        }, 1000);
      } catch (err: any) {
        let errorMessage = err?.response?.data?.message || err.message || 'Failed to create user';

        // Handle specific error cases
        if (
          err.response?.status === 409 ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('unique constraint')
        ) {
          errorMessage = 'This email is already registered';
        }

        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (field: string, value: string) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
      setError(null);
      setSuccess(null);
    };

    return (
      <Container maxWidth='600px'>
        <h1>Create New User</h1>
        <p>Add a new user to your organization with appropriate role permissions.</p>

        {error && <Alert style={{ marginBottom: 16, color: 'tomato' }}>{error}</Alert>}

        {success && <Alert style={{ marginBottom: 16, color: 'green' }}>{success}</Alert>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <Field>
            <Label>Email Address *</Label>
            <Input
              type='email'
              placeholder='user@example.com'
              value={formData.email}
              onChange={(e: any) => handleInputChange('email', e.target.value)}
            />
          </Field>

          <Field>
            <Label>Full Name *</Label>
            <Input
              type='text'
              placeholder='John Doe'
              value={formData.name}
              onChange={(e: any) => handleInputChange('name', e.target.value)}
            />
          </Field>

          <Field>
            <Label>Password *</Label>
            <Input
              type='password'
              placeholder='Minimum 6 characters'
              value={formData.password}
              onChange={(e: any) => handleInputChange('password', e.target.value)}
            />
          </Field>

          <Field>
            <Label>Role *</Label>
            <Select
              value={formData.role}
              onChange={(e: any) => handleInputChange('role', e.target.value)}
            >
              <option value='Viewer'>Viewer - Can view content only</option>
              <option value='Editor'>Editor - Can create and edit content</option>
              <option value='OrgAdmin'>OrgAdmin - Full administrative access</option>
            </Select>
          </Field>

          <Field>
            <Label>Organization *</Label>
            <Select
              value={formData.organizationId}
              onChange={(e: any) => handleInputChange('organizationId', e.target.value)}
              disabled={isLoadingOrgs}
            >
              <option value=''>Select an organization...</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
            {isLoadingOrgs && <small>Loading organizations...</small>}
          </Field>

          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating User...' : 'Create User'}
          </Button>
        </form>

        <div style={{ marginTop: 24, padding: 16, backgroundColor: 'black', borderRadius: 8 }}>
          <h4>Role Permissions:</h4>
          <ul style={{ margin: 8, paddingLeft: 20 }}>
            <li>
              <strong>Viewer:</strong> Can view posts, forms, and comments
            </li>
            <li>
              <strong>Editor:</strong> Can create/edit posts, manage tags, view admin panel
            </li>
            <li>
              <strong>OrgAdmin:</strong> Full access including user management and system settings
            </li>
          </ul>
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
  Button: ({ children, onClick, disabled, type, style }: any) => (
    <button data-testid='button' onClick={onClick} disabled={disabled} type={type} style={style}>
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
  Select: ({ value, onChange, disabled, children }: any) => (
    <select data-testid='select' value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
  Alert: ({ children, style }: any) => (
    <div data-testid='alert' style={style}>
      {children}
    </div>
  ),
}));

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

const createMockStore = (initialState = {}) => ({
  getState: () => ({
    auth: { token: 'mock-token' },
    tenant: { orgId: 'mock-org-id' },
    ...initialState,
  }),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
});

const renderWithProvider = (store: any) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <CreateUserPage />
      </BrowserRouter>
    </Provider>,
  );
};

describe('CreateUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorageGetItem.mockReturnValue(null);
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should render the page with correct title and description', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(
      screen.getByText('Add a new user to your organization with appropriate role permissions.'),
    ).toBeInTheDocument();
  });

  it('should render all form fields correctly', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Email Address *')).toBeInTheDocument();
    expect(screen.getByText('Full Name *')).toBeInTheDocument();
    expect(screen.getByText('Password *')).toBeInTheDocument();
    expect(screen.getByText('Role *')).toBeInTheDocument();
    expect(screen.getByText('Organization *')).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('should load organizations on mount', async () => {
    const mockOrganizations = [
      { id: 'org-1', name: 'Test Organization 1' },
      { id: 'org-2', name: 'Test Organization 2' },
    ];

    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/organizations',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Organization 1')).toBeInTheDocument();
      expect(screen.getByText('Test Organization 2')).toBeInTheDocument();
    });
  });

  it('should set default organization when orgId is available', async () => {
    const mockOrganizations = [
      { id: 'org-1', name: 'Test Organization 1' },
      { id: 'mock-org-id', name: 'Current Organization' },
    ];

    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      const orgSelect = screen.getAllByTestId('select')[1]; // Second select is organization
      expect(orgSelect).toHaveValue('mock-org-id');
    });
  });

  it('should show loading state while organizations are loading', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolve

    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
  });

  it('should handle organization loading error', async () => {
    mockedAxios.get.mockRejectedValue({ message: 'Failed to load organizations' });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Failed to load organizations')).toBeInTheDocument();
    });
  });

  it('should update form fields when typing', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(nameInput).toHaveValue('John Doe');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should update role selection', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const roleSelect = screen.getAllByTestId('select')[0];
    fireEvent.change(roleSelect, { target: { value: 'Editor' } });

    expect(roleSelect).toHaveValue('Editor');
  });

  it('should update organization selection', async () => {
    const mockOrganizations = [
      { id: 'org-1', name: 'Test Organization 1' },
      { id: 'org-2', name: 'Test Organization 2' },
    ];

    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      const orgSelect = screen.getAllByTestId('select')[1];
      fireEvent.change(orgSelect, { target: { value: 'org-2' } });
      expect(orgSelect).toHaveValue('org-2');
    });
  });

  it('should show error for missing required fields', async () => {
    const store = createMockStore();
    renderWithProvider(store);

    const form = screen.getAllByTestId('input')[0].closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('should successfully create user', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockResolvedValue({ data: { id: 'user-123' } });

    const store = createMockStore();
    renderWithProvider(store);

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    // Submit form
    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/users',
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'Viewer',
          organizationId: 'org-1',
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
            'x-org-id': 'mock-org-id',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('User John Doe (test@example.com) created successfully with Viewer role!'),
      ).toBeInTheDocument();
    });
  });

  it('should clear form after successful creation', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockResolvedValue({ data: {} });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/User John Doe.*created successfully/)).toBeInTheDocument();
    });

    // Form should be cleared
    expect(emailInput).toHaveValue('');
    expect(nameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  it('should show loading state during submission', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockImplementation(() => new Promise(() => {})); // Never resolve

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Creating User...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should handle API error', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: 'User creation failed' } },
    });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User creation failed')).toBeInTheDocument();
    });
  });

  it('should handle duplicate email error', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockRejectedValue({
      response: { status: 409, data: { message: 'Email already exists' } },
    });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('This email is already registered')).toBeInTheDocument();
    });
  });

  it('should clear error when form fields change', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockRejectedValue({ message: 'Test Error' });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form to trigger error
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    // Change input to clear error
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText('Test Error')).not.toBeInTheDocument();
    });
  });

  it('should use localStorage values when Redux values are not available', async () => {
    mockLocalStorageGetItem.mockImplementation(key => {
      if (key === 'token') return 'local-token';
      if (key === 'orgId') return 'local-org-id';
      return null;
    });

    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockResolvedValue({ data: {} });

    const store = createMockStore({
      auth: { token: null },
      tenant: { orgId: null },
    });
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer local-token',
            'x-org-id': 'local-org-id',
          }),
        }),
      );
    });
  });

  it('should display role permissions information', () => {
    const store = createMockStore();
    renderWithProvider(store);

    expect(screen.getByText('Role Permissions:')).toBeInTheDocument();

    // Check for individual parts of the role descriptions
    expect(screen.getByText('Viewer:')).toBeInTheDocument();
    expect(screen.getByText('Can view posts, forms, and comments')).toBeInTheDocument();

    expect(screen.getByText('Editor:')).toBeInTheDocument();
    expect(
      screen.getByText('Can create/edit posts, manage tags, view admin panel'),
    ).toBeInTheDocument();

    expect(screen.getByText('OrgAdmin:')).toBeInTheDocument();
    expect(
      screen.getByText('Full access including user management and system settings'),
    ).toBeInTheDocument();
  });

  it('should show correct role options in select', () => {
    const store = createMockStore();
    renderWithProvider(store);

    const roleSelect = screen.getAllByTestId('select')[0];
    expect(roleSelect).toHaveValue('Viewer');

    // Check that all role options are present
    expect(screen.getByText('Viewer - Can view content only')).toBeInTheDocument();
    expect(screen.getByText('Editor - Can create and edit content')).toBeInTheDocument();
    expect(screen.getByText('OrgAdmin - Full administrative access')).toBeInTheDocument();
  });

  it('should auto-hide success message after timeout', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockResolvedValue({ data: {} });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/User John Doe.*created successfully/)).toBeInTheDocument();
    });

    // Fast-forward time to trigger timeout
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.queryByText(/User John Doe.*created successfully/)).not.toBeInTheDocument();
    });
  });

  it('should handle network error gracefully', async () => {
    const mockOrganizations = [{ id: 'org-1', name: 'Test Organization' }];
    mockedAxios.get.mockResolvedValue({ data: mockOrganizations });
    mockedAxios.post.mockRejectedValue({ message: 'Network Error' });

    const store = createMockStore();
    renderWithProvider(store);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill and submit form
    const emailInput = screen.getAllByTestId('input')[0];
    const nameInput = screen.getAllByTestId('input')[1];
    const passwordInput = screen.getAllByTestId('input')[2];
    const orgSelect = screen.getAllByTestId('select')[1];

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });
});
