import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

// Mock the Header component
jest.mock('../header/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Component</div>;
  };
});

describe('Layout', () => {
  it('should render Header component', () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    expect(getByTestId('header')).toBeInTheDocument();
    expect(getByTestId('header')).toHaveTextContent('Header Component');
  });

  it('should render Outlet component', () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    expect(getByTestId('outlet')).toBeInTheDocument();
    expect(getByTestId('outlet')).toHaveTextContent('Outlet Content');
  });

  it('should render main element with correct styling', () => {
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveStyle('padding: 24px');
  });

  it('should render div wrapper with Header and main', () => {
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    const wrapperDiv = container.firstChild;
    expect(wrapperDiv).toBeInTheDocument();
    expect(wrapperDiv?.childNodes).toHaveLength(2);
  });

  it('should have correct structure: div > header + main', () => {
    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    const wrapperDiv = container.firstChild;
    const header = wrapperDiv?.firstChild;
    const main = wrapperDiv?.lastChild;

    expect(header).toHaveAttribute('data-testid', 'header');
    expect(main?.tagName).toBe('MAIN');
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );
    }).not.toThrow();
  });
});
