import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='container'>{children}</div>
  ),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to} data-testid='link' data-to={to}>
      {children}
    </a>
  ),
}));

const renderWithProvider = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>,
  );
};

describe('Dashboard', () => {
  it('should render the dashboard with correct title and description', () => {
    renderWithProvider();

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Welcome to the Admin Panel. Use the navigation above to access different admin functions.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the container component', () => {
    renderWithProvider();

    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('should display the available functions section', () => {
    renderWithProvider();

    expect(screen.getByText('Available Functions:')).toBeInTheDocument();
  });

  it('should list all available admin functions', () => {
    renderWithProvider();

    expect(screen.getByText('Admin Jobs')).toBeInTheDocument();
    expect(screen.getByText('- Manage background jobs and tasks')).toBeInTheDocument();

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('- View system audit logs and activity')).toBeInTheDocument();

    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(screen.getByText('- Add new users to the system')).toBeInTheDocument();

    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    expect(screen.getByText('- Add new organizations to the system')).toBeInTheDocument();
  });

  it('should render navigation links for create user and create organization', () => {
    renderWithProvider();

    const createUserLink = screen.getByText('Create New User').closest('a');
    expect(createUserLink).toHaveAttribute('href', '/create-user');
    expect(createUserLink).toHaveAttribute('data-to', '/create-user');

    const createOrgLink = screen.getByText('Create New Organization').closest('a');
    expect(createOrgLink).toHaveAttribute('href', '/create-organization');
    expect(createOrgLink).toHaveAttribute('data-to', '/create-organization');
  });

  it('should have proper styling for the functions list', () => {
    renderWithProvider();

    const functionsSection = screen.getByText('Available Functions:').closest('div');
    expect(functionsSection).toHaveStyle('margin-top: 24px');
  });

  it('should display functions in a list format', () => {
    renderWithProvider();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4);

    // Check that each function is in a list item
    expect(listItems[0]).toHaveTextContent('Admin Jobs');
    expect(listItems[1]).toHaveTextContent('Audit Logs');
    expect(listItems[2]).toHaveTextContent('Create New User');
    expect(listItems[3]).toHaveTextContent('Create New Organization');
  });

  it('should have proper heading hierarchy', () => {
    renderWithProvider();

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Admin Dashboard');

    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h3).toHaveTextContent('Available Functions:');
  });

  it('should render all text content correctly', () => {
    renderWithProvider();

    // Check all text content is present
    const expectedTexts = [
      'Admin Dashboard',
      'Welcome to the Admin Panel. Use the navigation above to access different admin functions.',
      'Available Functions:',
      'Admin Jobs',
      '- Manage background jobs and tasks',
      'Audit Logs',
      '- View system audit logs and activity',
      'Create New User',
      '- Add new users to the system',
      'Create New Organization',
      '- Add new organizations to the system',
    ];

    expectedTexts.forEach(text => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it('should have proper link accessibility', () => {
    renderWithProvider();

    const links = screen.getAllByTestId('link');
    expect(links).toHaveLength(2);

    links.forEach(link => {
      expect(link).toHaveAttribute('data-testid', 'link');
      expect(link.tagName).toBe('A');
    });
  });

  it('should render without any errors', () => {
    expect(() => renderWithProvider()).not.toThrow();
  });

  it('should have consistent structure', () => {
    renderWithProvider();

    // Check main structure
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
