import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PortalDashboard from './PortalDashboard';

// Mock UI Kit components
jest.mock('@portfolio-grade/ui-kit', () => ({
  Container: ({ children, maxWidth }: { children: React.ReactNode; maxWidth?: string }) => (
    <div data-testid='container' style={{ maxWidth }}>
      {children}
    </div>
  ),
}));

// Mock react-router-dom Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to} data-testid='link' data-to={to}>
      {children}
    </a>
  ),
}));

describe('PortalDashboard', () => {
  it('should render the dashboard title', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(screen.getByText('Portal Dashboard')).toBeInTheDocument();
  });

  it('should render the welcome message', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(
      screen.getByText(
        'Welcome to the Portal. Use the navigation above to access different portal functions.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the available functions section', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(screen.getByText('Available Functions:')).toBeInTheDocument();
  });

  it('should render Forms link with correct path', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const formsLink = screen.getByText('Forms').closest('a');
    expect(formsLink).toHaveAttribute('href', '/forms');
    expect(formsLink).toHaveAttribute('data-to', '/forms');
  });

  it('should render Posts link with correct path', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const postsLink = screen.getByText('Posts').closest('a');
    expect(postsLink).toHaveAttribute('href', '/posts');
    expect(postsLink).toHaveAttribute('data-to', '/posts');
  });

  it('should render Admin link with correct path', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const adminLink = screen.getByText('Admin').closest('a');
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(adminLink).toHaveAttribute('data-to', '/admin');
  });

  it('should render Forms description', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(
      screen.getByText((content, element) => {
        return (
          element?.textContent ===
          'Forms - View and manage forms. Create new forms, edit existing ones, and preview form submissions.'
        );
      }),
    ).toBeInTheDocument();
  });

  it('should render Posts description', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(
      screen.getByText((content, element) => {
        return (
          element?.textContent ===
          'Posts - View and manage posts. Create new posts, edit existing ones, add comments, and filter by tags.'
        );
      }),
    ).toBeInTheDocument();
  });

  it('should render Admin description', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(
      screen.getByText((content, element) => {
        return (
          element?.textContent ===
          'Admin - Access admin functions (if you have admin privileges). Manage users, organizations, and system settings.'
        );
      }),
    ).toBeInTheDocument();
  });

  it('should render all function links in a list', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const links = screen.getAllByTestId('link');
    expect(links).toHaveLength(3);

    const hrefs = links.map(link => link.getAttribute('href'));
    expect(hrefs).toEqual(['/forms', '/posts', '/admin']);
  });

  it('should have proper list structure', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('should render Container component', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    const h3 = screen.getByRole('heading', { level: 3 });

    expect(h1).toHaveTextContent('Portal Dashboard');
    expect(h3).toHaveTextContent('Available Functions:');
  });

  it('should have proper spacing and layout', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );
    const container = screen.getByTestId('container');
    expect(container).toBeInTheDocument();
  });

  it('should render all text content correctly', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );

    // Check all expected text content
    expect(screen.getByText('Portal Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Welcome to the Portal. Use the navigation above to access different portal functions.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Available Functions:')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should have proper link styling with strong tags', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );

    // Find the strong elements that contain the links
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    listItems.forEach(item => {
      const strongElement = item.querySelector('strong');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement?.tagName).toBe('STRONG');
    });
  });

  it('should render with BrowserRouter context', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );

    // Links should be rendered properly within router context
    const links = screen.getAllByTestId('link');
    expect(links).toHaveLength(3);
  });

  it('should have proper semantic structure', () => {
    render(
      <BrowserRouter>
        <PortalDashboard />
      </BrowserRouter>,
    );

    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('Portal Dashboard');
    expect(headings[1]).toHaveTextContent('Available Functions:');

    // Check for list structure
    const list = screen.getByRole('list');
    const listItems = screen.getAllByRole('listitem');
    expect(list).toBeInTheDocument();
    expect(listItems).toHaveLength(3);
  });
});
