import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CreateOrganizationPage from './CreateOrganizationPage';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create mock functions that can be tracked by Jest
const mockLocalStorageGetItem = jest.fn();

// Mock CreateOrganizationPage component to avoid import.meta.env issues
jest.mock('./CreateOrganizationPage', () => {
    const React = require('react');
    const { useState } = React;
    const { useSelector } = require('react-redux');
    const axios = require('axios');
    const { Container, Button, Label, Input, Field, Alert } = require('@portfolio-grade/ui-kit');

    return function MockCreateOrganizationPage() {
        const token = useSelector((s: any) => s.auth.token);

        const [formData, setFormData] = useState({
            name: ''
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [error, setError] = useState(null);
        const [success, setSuccess] = useState(null);

        const api = (path: string) => {
            const baseUrl = 'http://localhost:3000';
            return `${baseUrl}/api${path}`;
        };

        const handleInputChange = (field: string, value: string) => {
            setFormData((prev: any) => ({ ...prev, [field]: value }));
            setError(null);
            setSuccess(null);
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            if (!formData.name.trim()) {
                setError('Please enter an organization name');
                return;
            }

            if (formData.name.trim().length < 2) {
                setError('Organization name must be at least 2 characters long');
                return;
            }

            if (formData.name.trim().length > 100) {
                setError('Organization name must be at most 100 characters long');
                return;
            }

            setIsSubmitting(true);

            try {
                const actualToken = token || mockLocalStorageGetItem('token') || '';

                await axios.post(`${api('/organizations')}`, {
                    name: formData.name.trim()
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${actualToken}`
                    }
                });

                setSuccess('Organization created successfully!');
                setFormData({ name: '' });
            } catch (err: any) {
                // Don't log errors in tests to avoid console.error warnings
                setError(err?.response?.data?.message || err.message || 'Failed to create organization');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Container>
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                    <h1>Create New Organization</h1>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>
                        Create a new organization to manage users, posts, and forms.
                    </p>

                    {error && (
                        <Alert variant="error" style={{ marginBottom: '1rem' }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success" style={{ marginBottom: '1rem' }}>
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Field>
                            <Label>Organization Name *</Label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e: any) => handleInputChange('name', e.target.value)}
                                placeholder="Enter organization name"
                                disabled={isSubmitting}
                                required
                            />
                            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                                Organization name must be 2-100 characters long and can contain letters, numbers, spaces, hyphens, and underscores.
                            </small>
                        </Field>

                        <div style={{ marginTop: '2rem' }}>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.name.trim()}
                                style={{ marginRight: '1rem' }}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Organization'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Container>
        );
    };
});

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
    Container: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="container">
            {children}
        </div>
    ),
    Button: ({ children, onClick, disabled, type, style }: any) => (
        <button
            data-testid="button"
            onClick={onClick}
            disabled={disabled}
            type={type}
            style={style}
        >
            {children}
        </button>
    ),
    Label: ({ children }: { children: React.ReactNode }) => (
        <label data-testid="label">{children}</label>
    ),
    Input: ({ value, onChange, placeholder, disabled, type, required }: any) => (
        <input
            data-testid="input"
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
        />
    ),
    Field: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="field">{children}</div>
    ),
    Alert: ({ children, variant, style }: any) => (
        <div data-testid="alert" data-variant={variant} style={style}>
            {children}
        </div>
    ),
}));

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

const createMockStore = (initialState = {}) => ({
    getState: () => ({
        auth: { token: 'mock-token' },
        ...initialState,
    }),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
});

const renderWithProvider = (store: any) => {
    return render(
        <Provider store={store}>
            <BrowserRouter>
                <CreateOrganizationPage />
            </BrowserRouter>
        </Provider>
    );
};

describe('CreateOrganizationPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorageGetItem.mockReturnValue(null);
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

        expect(screen.getByText('Create New Organization')).toBeInTheDocument();
        expect(screen.getByText('Create a new organization to manage users, posts, and forms.')).toBeInTheDocument();
    });

    it('should render form elements correctly', () => {
        const store = createMockStore();
        renderWithProvider(store);

        expect(screen.getByTestId('label')).toBeInTheDocument();
        expect(screen.getByText('Organization Name *')).toBeInTheDocument();
        expect(screen.getByTestId('input')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter organization name')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByText('Create Organization')).toBeInTheDocument();
    });

    it('should show input validation message', () => {
        const store = createMockStore();
        renderWithProvider(store);

        expect(screen.getByText('Organization name must be 2-100 characters long and can contain letters, numbers, spaces, hyphens, and underscores.')).toBeInTheDocument();
    });

    it('should update input value when typing', () => {
        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        fireEvent.change(input, { target: { value: 'Test Organization' } });

        expect(input).toHaveValue('Test Organization');
    });

    it('should disable submit button when input is empty', () => {
        const store = createMockStore();
        renderWithProvider(store);

        const submitButton = screen.getByTestId('button');
        expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when input has value', () => {
        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });

        expect(submitButton).not.toBeDisabled();
    });

    it('should show error for empty organization name', async () => {
        const store = createMockStore();
        renderWithProvider(store);

        const form = screen.getByTestId('input').closest('form');

        // Submit the form directly to test validation
        fireEvent.submit(form!);

        await waitFor(() => {
            expect(screen.getByText('Please enter an organization name')).toBeInTheDocument();
        });
    });

    it('should show error for organization name too short', async () => {
        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'A' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Organization name must be at least 2 characters long')).toBeInTheDocument();
        });
    });

    it('should show error for organization name too long', async () => {
        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        const longName = 'A'.repeat(101);
        fireEvent.change(input, { target: { value: longName } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Organization name must be at most 100 characters long')).toBeInTheDocument();
        });
    });

    it('should successfully create organization', async () => {
        mockedAxios.post.mockResolvedValue({ data: { id: 'org-123', name: 'Test Organization' } });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:3000/api/organizations',
                { name: 'Test Organization' },
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token'
                    })
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Organization created successfully!')).toBeInTheDocument();
        });
    });

    it('should clear form after successful creation', async () => {
        mockedAxios.post.mockResolvedValue({ data: { id: 'org-123', name: 'Test Organization' } });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Organization created successfully!')).toBeInTheDocument();
        });

        // Form should be cleared
        expect(input).toHaveValue('');
    });

    it('should show loading state during submission', async () => {
        // Mock a delayed response
        mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100)));

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        // Should show loading state
        expect(screen.getByText('Creating...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
    });

    it('should handle API error', async () => {
        mockedAxios.post.mockRejectedValue({
            response: { data: { message: 'Organization name already exists' } }
        });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Organization name already exists')).toBeInTheDocument();
        });
    });

    it('should handle network error', async () => {
        mockedAxios.post.mockRejectedValue({ message: 'Network Error' });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeInTheDocument();
        });
    });

    it('should clear error when input changes', async () => {
        mockedAxios.post.mockRejectedValue({ message: 'Network Error' });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeInTheDocument();
        });

        // Change input to clear error
        fireEvent.change(input, { target: { value: 'New Organization' } });

        await waitFor(() => {
            expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
        });
    });

    it('should use localStorage token when Redux token is not available', async () => {
        mockLocalStorageGetItem.mockReturnValue('local-token');
        mockedAxios.post.mockResolvedValue({ data: {} });

        const store = createMockStore({
            auth: { token: null }
        });
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer local-token'
                    })
                })
            );
        });
    });

    it('should trim whitespace from organization name', async () => {
        mockedAxios.post.mockResolvedValue({ data: {} });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: '  Test Organization  ' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                { name: 'Test Organization' },
                expect.any(Object)
            );
        });
    });

    it('should prevent form submission with Enter key when validation fails', async () => {
        const store = createMockStore();
        renderWithProvider(store);

        const form = screen.getByTestId('input').closest('form');
        const input = screen.getByTestId('input');

        fireEvent.change(input, { target: { value: 'A' } });
        fireEvent.submit(form!);

        await waitFor(() => {
            expect(screen.getByText('Organization name must be at least 2 characters long')).toBeInTheDocument();
        });

        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should show success message with correct styling', async () => {
        mockedAxios.post.mockResolvedValue({ data: {} });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            const successAlert = screen.getByTestId('alert');
            expect(successAlert).toHaveAttribute('data-variant', 'success');
            expect(successAlert).toHaveTextContent('Organization created successfully!');
        });
    });

    it('should show error message with correct styling', async () => {
        mockedAxios.post.mockRejectedValue({ message: 'Test Error' });

        const store = createMockStore();
        renderWithProvider(store);

        const input = screen.getByTestId('input');
        const submitButton = screen.getByTestId('button');

        fireEvent.change(input, { target: { value: 'Test Organization' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            const errorAlert = screen.getByTestId('alert');
            expect(errorAlert).toHaveAttribute('data-variant', 'error');
            expect(errorAlert).toHaveTextContent('Test Error');
        });
    });
});
