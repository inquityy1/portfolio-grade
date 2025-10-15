import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import EditFormPage from './EditFormPage';

// Mock the utility functions
jest.mock('./EditFormPage.utils', () => ({
  formatJsonSchema: jest.fn(),
  validateFormData: jest.fn(),
  fetchForm: jest.fn(),
  updateForm: jest.fn(),
}));

// Mock UI kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Container: ({ children, maxWidth, ...props }: any) => (
    <div data-testid='container' {...props}>
      {children}
    </div>
  ),
  LoadingContainer: ({ children }: any) => <div data-testid='loading-container'>{children}</div>,
  Alert: ({ children, variant }: any) => <div data-testid={`alert-${variant}`}>{children}</div>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, required, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  ),
  Label: ({ children }: any) => <label>{children}</label>,
  Field: ({ children }: any) => <div>{children}</div>,
  Textarea: ({ value, onChange, rows, placeholder, required, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  ),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-form-id' }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>,
  );
};

describe('EditFormPage', () => {
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
    const { fetchForm } = require('./EditFormPage.utils');
    fetchForm.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<EditFormPage />);

    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  it('should render form elements after loading', async () => {
    const { fetchForm } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter form name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter JSON schema')).toBeInTheDocument();
      expect(screen.getByText('Format JSON')).toBeInTheDocument();
      expect(screen.getByText('Update Form')).toBeInTheDocument();
    });
  });

  it('should populate form fields with fetched data', async () => {
    const { fetchForm } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Enter form name');
      expect(nameInput).toHaveValue('Test Form');
    });
  });

  it('should handle form input changes', async () => {
    const { fetchForm } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Enter form name');
      fireEvent.change(nameInput, { target: { value: 'Updated Form' } });
      expect(nameInput).toHaveValue('Updated Form');
    });
  });

  it('should call formatJsonSchema when Format JSON button is clicked', async () => {
    const { fetchForm, formatJsonSchema } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);
    formatJsonSchema.mockReturnValue({ formatted: 'formatted json', error: null });

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      const formatButton = screen.getByText('Format JSON');
      fireEvent.click(formatButton);
      expect(formatJsonSchema).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    const { fetchForm, validateFormData, updateForm } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);
    validateFormData.mockReturnValue({ isValid: true, error: null });
    updateForm.mockResolvedValue({ id: 'test-id', name: 'Updated Form' });

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Enter form name');
      fireEvent.change(nameInput, { target: { value: 'Updated Form' } });

      const submitButton = screen.getByText('Update Form');
      fireEvent.click(submitButton);

      expect(validateFormData).toHaveBeenCalled();
      expect(updateForm).toHaveBeenCalled();
    });
  });

  it('should show error when validation fails', async () => {
    const { fetchForm, validateFormData } = require('./EditFormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    fetchForm.mockResolvedValue(mockForm);
    validateFormData.mockReturnValue({ isValid: false, error: 'Form name is required' });

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      const submitButton = screen.getByText('Update Form');
      fireEvent.click(submitButton);

      expect(screen.getByText('Form name is required')).toBeInTheDocument();
    });
  });

  it('should navigate to login on 401/403 error', async () => {
    const { fetchForm } = require('./EditFormPage.utils');
    fetchForm.mockRejectedValue({ response: { status: 401 } });

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should navigate to forms list on 404 error', async () => {
    const { fetchForm } = require('./EditFormPage.utils');
    fetchForm.mockRejectedValue({ response: { status: 404 } });

    renderWithRouter(<EditFormPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/forms', { replace: true });
    });
  });
});
