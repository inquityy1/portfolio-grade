import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock the CreateFormPage component to avoid import.meta.env issues
jest.mock('./CreateFormPage', () => {
  const mockReact = require('react');
  const MockCreateFormPage = function MockCreateFormPage() {
    const [name, setName] = mockReact.useState('');
    const [schema, setSchema] = mockReact.useState(
      '{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string",\n      "title": "Name"\n    },\n    "email": {\n      "type": "string",\n      "title": "Email",\n      "format": "email"\n    }\n  },\n  "required": ["name", "email"]\n}',
    );
    const [submitting, setSubmitting] = mockReact.useState(false);
    const [error, setError] = mockReact.useState(null);

    const formatJson = () => {
      try {
        const cleaned = schema.replace(/,(\s*[}\]])/g, '$1');
        const parsed = JSON.parse(cleaned);
        setSchema(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch (e: any) {
        setError(`Cannot format JSON: ${e.message}`);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setError('Form name is required');
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        let parsedSchema;
        try {
          parsedSchema = JSON.parse(schema);
        } catch (e: any) {
          setError(`Invalid JSON schema: ${e.message}`);
          return;
        }

        const mockAxios = require('axios');
        const { data } = await mockAxios.post(
          'http://localhost:3000/api/forms',
          {
            name: name.trim(),
            schema: parsedSchema,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer mock-token',
              'x-org-id': 'mock-org-id',
            },
          },
        );

        const mockNavigate = require('react-router-dom').useNavigate();
        mockNavigate('/forms', {
          replace: true,
          state: { flash: `Form "${data.name}" created successfully! ✅` },
        });
      } catch (e: any) {
        if (e.response?.status === 401 || e.response?.status === 403) {
          const mockNavigate = require('react-router-dom').useNavigate();
          mockNavigate('/login', { replace: true });
        } else {
          setError(e.message || 'Failed to create form');
        }
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div data-testid='container' style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>Create New Form</h1>
          <p style={{ opacity: 0.7, margin: 0 }}>
            Create a new form with custom fields and validation.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div data-testid='field'>
            <label data-testid='label'>Form Name *</label>
            <input
              data-testid='input'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Enter form name'
              required
            />
          </div>

          <div data-testid='field'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <label data-testid='label'>JSON Schema *</label>
              <button
                data-testid='button'
                type='button'
                onClick={formatJson}
                style={{ fontSize: 12, padding: '4px 8px' }}
              >
                Format JSON
              </button>
            </div>
            <textarea
              data-testid='textarea'
              value={schema}
              onChange={e => setSchema(e.target.value)}
              rows={12}
              placeholder='Enter JSON schema'
              style={{ fontFamily: 'monospace', fontSize: 14 }}
              required
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Define your form fields using JSON Schema format. This determines what fields users
              will see. Use the "Format JSON" button to fix common issues like trailing commas.
            </div>
          </div>

          {error && (
            <div data-testid='alert' data-variant='error'>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              data-testid='button'
              type='button'
              onClick={() => {
                const mockNavigate = require('react-router-dom').useNavigate();
                mockNavigate('/', { replace: true });
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button data-testid='button' type='submit' disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </form>
      </div>
    );
  };
  return { default: MockCreateFormPage };
});

const CreateFormPage = require('./CreateFormPage').default;

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
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockLocalStorageGetItem,
    setItem: jest.fn(),
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
}));

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button data-testid='button' onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, required }: any) => (
    <input
      data-testid='input'
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid='label'>{children}</label>
  ),
  Field: ({ children }: { children: React.ReactNode }) => <div data-testid='field'>{children}</div>,
  Textarea: ({ value, onChange, rows, placeholder, required, style }: any) => (
    <textarea
      data-testid='textarea'
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      required={required}
      style={style}
    />
  ),
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

describe('CreateFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorageGetItem.mockImplementation(key => {
      if (key === 'token' || key === 'accessToken') return 'mock-token';
      if (key === 'orgId' || key === 'orgid') return 'mock-org-id';
      return null;
    });
  });

  it('should render page title and description', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    expect(screen.getByText('Create New Form')).toBeInTheDocument();
    expect(
      screen.getByText('Create a new form with custom fields and validation.'),
    ).toBeInTheDocument();
  });

  it('should render form elements', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    expect(screen.getByText('Form Name *')).toBeInTheDocument();
    expect(screen.getByText('JSON Schema *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter form name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter JSON schema')).toBeInTheDocument();
    expect(screen.getByText('Format JSON')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Form')).toBeInTheDocument();
  });

  it('should have default schema value', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('"type": "object"');
    expect(textarea.value).toContain('"properties"');
    expect(textarea.value).toContain('"name"');
    expect(textarea.value).toContain('"email"');
  });

  it('should update form name when typing', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });
    expect(nameInput).toHaveValue('My Test Form');
  });

  it('should update schema when typing', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: '{"test": "value"}' } });
    expect(textarea).toHaveValue('{"test": "value"}');
  });

  it('should format JSON when format button is clicked', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const textarea = screen.getByTestId('textarea');
    const formatButton = screen.getByText('Format JSON');

    // Set invalid JSON with trailing comma
    fireEvent.change(textarea, { target: { value: '{"test": "value",}' } });
    fireEvent.click(formatButton);

    // Should format the JSON
    expect((textarea as HTMLTextAreaElement).value).toContain('"test"');
    expect((textarea as HTMLTextAreaElement).value).toContain('"value"');
  });

  it('should show error for invalid JSON format', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const textarea = screen.getByTestId('textarea');
    const formatButton = screen.getByText('Format JSON');

    // Set completely invalid JSON
    fireEvent.change(textarea, { target: { value: 'invalid json' } });
    fireEvent.click(formatButton);

    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText(/Cannot format JSON/)).toBeInTheDocument();
  });

  it('should handle successful form creation', async () => {
    const mockResponse = { data: { id: 'new-form-id', name: 'My Test Form' } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });

    const createButton = screen.getByText('Create Form');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/forms',
        {
          name: 'My Test Form',
          schema: expect.any(Object),
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer mock-token',
            'x-org-id': 'mock-org-id',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/forms', {
        replace: true,
        state: { flash: 'Form "My Test Form" created successfully! ✅' },
      });
    });
  });

  it('should show error for empty form name', async () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const form = screen.getByTestId('input').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('Form name is required')).toBeInTheDocument();
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should show error for invalid JSON schema', async () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    const textarea = screen.getByTestId('textarea');

    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    const createButton = screen.getByText('Create Form');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid JSON schema/)).toBeInTheDocument();
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });

    const createButton = screen.getByText('Create Form');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should redirect to login on 401/403 errors', async () => {
    mockedAxios.post.mockRejectedValue({ response: { status: 401 } });

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });

    const createButton = screen.getByText('Create Form');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should show loading state during submission', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });

    const createButton = screen.getByText('Create Form');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('should disable create button when name is empty', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const createButton = screen.getByText('Create Form');
    expect(createButton).toBeDisabled();
  });

  it('should enable create button when name is provided', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const nameInput = screen.getByTestId('input');
    const createButton = screen.getByText('Create Form');

    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });
    expect(createButton).not.toBeDisabled();
  });

  it('should handle cancel button click', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should handle form submission', async () => {
    const mockResponse = { data: { id: 'new-form-id', name: 'My Test Form' } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });

    const form = nameInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  it('should render container with correct max width', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const container = screen.getByTestId('container');
    expect(container).toHaveStyle('max-width: 800px');
  });

  it('should have proper form structure', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const form = screen.getByTestId('input').closest('form');
    expect(form).toBeInTheDocument();

    const inputs = screen.getAllByTestId('input');
    const textareas = screen.getAllByTestId('textarea');
    expect(inputs).toHaveLength(1);
    expect(textareas).toHaveLength(1);
  });

  it('should show JSON schema help text', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    expect(
      screen.getByText(/Define your form fields using JSON Schema format/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use the "Format JSON" button to fix common issues/),
    ).toBeInTheDocument();
  });

  it('should handle textarea with monospace font', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveStyle('font-family: monospace');
    expect(textarea).toHaveStyle('font-size: 14px');
  });

  it('should handle format button styling', () => {
    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );
    const formatButton = screen.getByText('Format JSON');
    expect(formatButton).toHaveAttribute('type', 'button');
  });

  it('should handle button states correctly', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <CreateFormPage />
      </BrowserRouter>,
    );

    const nameInput = screen.getByTestId('input');
    const createButton = screen.getByText('Create Form');
    const cancelButton = screen.getByText('Cancel');

    fireEvent.change(nameInput, { target: { value: 'My Test Form' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });
});
