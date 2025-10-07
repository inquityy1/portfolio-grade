import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormRenderer from './FormRenderer';

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} data-testid='button'>
      {children}
    </button>
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid='label'>{children}</label>
  ),
  Input: ({ value, onChange, placeholder, required, type }: any) => (
    <input
      data-testid='input'
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  ),
  Textarea: ({ value, onChange, placeholder, required, rows }: any) => (
    <textarea
      data-testid='textarea'
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
    />
  ),
  Select: ({ value, onChange, required, children }: any) => (
    <select data-testid='select' value={value} onChange={onChange} required={required}>
      {children}
    </select>
  ),
  Checkbox: ({ checked, onChange }: any) => (
    <input data-testid='checkbox' type='checkbox' checked={checked} onChange={onChange} />
  ),
  Field: ({ children }: { children: React.ReactNode }) => <div data-testid='field'>{children}</div>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FormRenderer', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const inputField = {
    id: '1',
    label: 'Name',
    type: 'input',
    order: 1,
    config: { name: 'name', placeholder: 'Enter name', required: true },
  };

  const textareaField = {
    id: '2',
    label: 'Description',
    type: 'textarea',
    order: 2,
    config: { name: 'description', placeholder: 'Enter description', rows: 5 },
  };

  const selectField = {
    id: '3',
    label: 'Category',
    type: 'select',
    order: 3,
    config: { name: 'category', options: ['Option 1', 'Option 2', 'Option 3'] },
  };

  const checkboxField = {
    id: '4',
    label: 'Agree to terms',
    type: 'checkbox',
    order: 4,
    config: { name: 'agree' },
  };

  it('should render input field correctly', () => {
    renderWithRouter(<FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toHaveAttribute('required');
  });

  it('should render textarea field correctly', () => {
    renderWithRouter(<FormRenderer fields={[textareaField]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByTestId('textarea')).toBeInTheDocument();
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
  });

  it('should render select field correctly', () => {
    renderWithRouter(<FormRenderer fields={[selectField]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByTestId('select')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render checkbox field correctly', () => {
    renderWithRouter(<FormRenderer fields={[checkboxField]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Agree to terms')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('should render multiple fields in correct order', () => {
    renderWithRouter(
      <FormRenderer fields={[inputField, textareaField, selectField]} onSubmit={mockOnSubmit} />,
    );

    const fields = screen.getAllByTestId('field');
    expect(fields).toHaveLength(3);
  });

  it('should sort fields by order property', () => {
    const unorderedFields = [
      { ...inputField, order: 3 },
      { ...textareaField, order: 1 },
      { ...selectField, order: 2 },
    ];

    renderWithRouter(<FormRenderer fields={unorderedFields} onSubmit={mockOnSubmit} />);

    const fields = screen.getAllByTestId('field');
    expect(fields[0]).toHaveTextContent('Description');
    expect(fields[1]).toHaveTextContent('Category');
    expect(fields[2]).toHaveTextContent('Name');
  });

  it('should handle fields without order property', () => {
    const fieldWithoutOrder = { ...inputField, order: null };
    renderWithRouter(<FormRenderer fields={[fieldWithoutOrder]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should update input values correctly', () => {
    renderWithRouter(<FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'John Doe' } });

    expect(input).toHaveValue('John Doe');
  });

  it('should update textarea values correctly', () => {
    renderWithRouter(<FormRenderer fields={[textareaField]} onSubmit={mockOnSubmit} />);

    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    expect(textarea).toHaveValue('Test description');
  });

  it('should update select values correctly', () => {
    renderWithRouter(<FormRenderer fields={[selectField]} onSubmit={mockOnSubmit} />);

    const select = screen.getByTestId('select');
    fireEvent.change(select, { target: { value: 'Option 2' } });

    expect(select).toHaveValue('Option 2');
  });

  it('should update checkbox values correctly', () => {
    renderWithRouter(<FormRenderer fields={[checkboxField]} onSubmit={mockOnSubmit} />);

    const checkbox = screen.getByTestId('checkbox');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('should submit form with correct values', () => {
    renderWithRouter(<FormRenderer fields={[inputField, checkboxField]} onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('Enter name');
    const checkbox = screen.getByTestId('checkbox');
    const submitButton = screen.getByText('Submit');

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(checkbox);
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      agree: true,
    });
  });

  it('should show submitting state when submitting prop is true', () => {
    renderWithRouter(
      <FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} submitting={true} />,
    );

    const submitButton = screen.getByText('Submitting…');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should show normal submit button when submitting prop is false', () => {
    renderWithRouter(
      <FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} submitting={false} />,
    );

    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('should render Back to Forms button', () => {
    renderWithRouter(<FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Back to Forms')).toBeInTheDocument();
  });

  it('should handle empty fields array', () => {
    renderWithRouter(<FormRenderer fields={[]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Back to Forms')).toBeInTheDocument();
  });

  it('should use label as key when config.name is not available', () => {
    const fieldWithoutName = {
      id: '1',
      label: 'Test Field',
      type: 'input',
      config: { placeholder: 'Test placeholder' },
    };

    renderWithRouter(<FormRenderer fields={[fieldWithoutName]} onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('Test placeholder');
    fireEvent.change(input, { target: { value: 'Test value' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      'Test Field': 'Test value',
    });
  });

  it('should handle select field with empty options', () => {
    const selectFieldEmpty = {
      id: '1',
      label: 'Empty Select',
      type: 'select',
      config: { name: 'emptySelect', options: [] },
    };

    renderWithRouter(<FormRenderer fields={[selectFieldEmpty]} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Empty Select')).toBeInTheDocument();
    expect(screen.getByText('Select…')).toBeInTheDocument();
  });

  it('should handle textarea with default rows', () => {
    const textareaFieldDefault = {
      id: '1',
      label: 'Default Textarea',
      type: 'textarea',
      config: { name: 'defaultTextarea' },
    };

    renderWithRouter(<FormRenderer fields={[textareaFieldDefault]} onSubmit={mockOnSubmit} />);

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('should prevent default form submission', () => {
    renderWithRouter(<FormRenderer fields={[inputField]} onSubmit={mockOnSubmit} />);

    const form = screen.getByPlaceholderText('Enter name').closest('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

    fireEvent(form!, submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
