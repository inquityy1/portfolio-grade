import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FormPage from './FormPage';

// Mock the utility functions
jest.mock('./FormPage.utils', () => ({
  fetchForm: jest.fn(),
  submitForm: jest.fn(),
  convertSchemaToFields: jest.fn(),
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
}));

// Mock FormRenderer
jest.mock('../../../components/formRenderer/FormRenderer', () => {
  return function MockFormRenderer({ fields, onSubmit, submitting }: any) {
    return (
      <div data-testid='form-renderer'>
        <div data-testid='fields-count'>{fields.length}</div>
        <button
          data-testid='submit-button'
          onClick={() => onSubmit({ test: 'value' })}
          disabled={submitting}
        >
          Submit
        </button>
      </div>
    );
  };
});

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

describe('FormPage', () => {
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
    const { fetchForm } = require('./FormPage.utils');
    fetchForm.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<FormPage />);

    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  it('should render form after loading', async () => {
    const { fetchForm, convertSchemaToFields } = require('./FormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    const mockFields = [{ id: 'field_1', label: 'Name', type: 'input', config: { name: 'name' } }];

    fetchForm.mockResolvedValue(mockForm);
    convertSchemaToFields.mockReturnValue(mockFields);

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('fields-count')).toHaveTextContent('1');
    });
  });

  it('should handle form submission', async () => {
    const { fetchForm, convertSchemaToFields, submitForm } = require('./FormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    const mockFields = [{ id: 'field_1', label: 'Name', type: 'input', config: { name: 'name' } }];

    fetchForm.mockResolvedValue(mockForm);
    convertSchemaToFields.mockReturnValue(mockFields);
    submitForm.mockResolvedValue({ id: 'submission-id', formId: 'test-id', data: {} });

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button');
      submitButton.click();
    });

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith('test-form-id', { test: 'value' });
    });
  });

  it('should show error when form loading fails', async () => {
    const { fetchForm } = require('./FormPage.utils');
    fetchForm.mockRejectedValue({ response: { status: 500 }, message: 'Server error' });

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should navigate to login on 401/403 error', async () => {
    const { fetchForm } = require('./FormPage.utils');
    fetchForm.mockRejectedValue({ response: { status: 401 } });

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should show form not found when no form data', async () => {
    const { fetchForm } = require('./FormPage.utils');
    fetchForm.mockResolvedValue(null);

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      expect(screen.getByText('Form not found')).toBeInTheDocument();
    });
  });

  it('should handle submission error', async () => {
    const { fetchForm, convertSchemaToFields, submitForm } = require('./FormPage.utils');
    const mockForm = {
      id: 'test-id',
      name: 'Test Form',
      schema: { type: 'object', properties: {} },
    };
    const mockFields = [{ id: 'field_1', label: 'Name', type: 'input', config: { name: 'name' } }];

    fetchForm.mockResolvedValue(mockForm);
    convertSchemaToFields.mockReturnValue(mockFields);
    submitForm.mockRejectedValue({ response: { status: 500 }, message: 'Submission failed' });

    renderWithRouter(<FormPage />);

    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button');
      submitButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });
});
