import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<Modal {...defaultProps} open={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should display the title correctly', () => {
    render(<Modal {...defaultProps} title='Custom Title' />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <Modal {...defaultProps}>
        <div data-testid='custom-content'>Custom Content</div>
      </Modal>,
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<Modal {...defaultProps} />);

    // Find the backdrop by looking for the outermost div with the overlay styles
    const modalContent = screen.getByText('Test Modal').closest('div');
    const backdrop = modalContent?.parentElement?.parentElement; // Go up two levels to get the backdrop

    // Ensure we found the backdrop
    expect(backdrop).toBeTruthy();

    // Reset mock before testing
    mockOnClose.mockClear();

    // Click the backdrop element directly
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen.getByText('Modal Content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render footer when provided', () => {
    const footer = <button>Save</button>;
    render(<Modal {...defaultProps} footer={footer} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should not render footer when not provided', () => {
    render(<Modal {...defaultProps} />);

    // Footer should not be present
    const modalContent = screen.getByText('Modal Content').closest('div');
    const footer = modalContent?.nextElementSibling;
    expect(footer).toBeNull();
  });

  it('should have correct styling for backdrop', () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen.getByText('Test Modal').closest('div');
    const backdrop = modalContent?.parentElement?.parentElement; // Go up two levels to get the backdrop

    // Check for key styling properties that should be present
    expect(backdrop).toHaveStyle({
      position: 'fixed',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '1000',
    });
  });

  it('should have correct styling for modal content', () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen.getByText('Test Modal').closest('div')?.parentElement; // Go up one level to get the modal content div

    // Check for key styling properties that should be present
    expect(modalContent).toHaveStyle({
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
    });
  });

  it('should have correct close button styling', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByText('×');
    expect(closeButton).toHaveStyle({
      background: 'none',
      color: '#999',
      cursor: 'pointer',
      padding: '4px',
    });
  });

  it('should handle multiple children', () => {
    render(
      <Modal {...defaultProps}>
        <div>First Child</div>
        <div>Second Child</div>
      </Modal>,
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('should handle complex footer content', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );
    render(<Modal {...defaultProps} footer={footer} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should prevent event propagation on modal content click', () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen.getByText('Modal Content').closest('div');

    // Test that clicking modal content doesn't trigger backdrop click
    fireEvent.click(modalContent!);

    // onClose should not be called when clicking modal content
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
