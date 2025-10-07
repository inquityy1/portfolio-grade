import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from './ProtectedRoute';

// Mock react-router-dom components
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
    <div data-testid='navigate' data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
  Outlet: () => <div data-testid='outlet'>Outlet Content</div>,
}));

// Mock the app-state module
jest.mock('@portfolio-grade/app-state', () => ({
  authSlice: {
    name: 'auth',
    initialState: { token: null },
    reducers: {},
  },
}));

describe('ProtectedRoute', () => {
  const createMockStore = (token: string | null) => {
    return configureStore({
      reducer: {
        auth: (state = { token }, action: any) => state,
      },
    });
  };

  const renderWithProvider = (store: any) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute />
        </BrowserRouter>
      </Provider>,
    );
  };

  it('should render Navigate component when no token is present', () => {
    const store = createMockStore(null);
    const { getByTestId } = renderWithProvider(store);

    const navigateElement = getByTestId('navigate');
    expect(navigateElement).toBeInTheDocument();
    expect(navigateElement).toHaveAttribute('data-to', '/login');
    expect(navigateElement).toHaveAttribute('data-replace', 'true');
  });

  it('should render Navigate component when token is empty string', () => {
    const store = createMockStore('');
    const { getByTestId } = renderWithProvider(store);

    const navigateElement = getByTestId('navigate');
    expect(navigateElement).toBeInTheDocument();
    expect(navigateElement).toHaveAttribute('data-to', '/login');
    expect(navigateElement).toHaveAttribute('data-replace', 'true');
  });

  it('should render Outlet component when token is present', () => {
    const store = createMockStore('valid-token');
    const { getByTestId } = renderWithProvider(store);

    const outletElement = getByTestId('outlet');
    expect(outletElement).toBeInTheDocument();
    expect(outletElement).toHaveTextContent('Outlet Content');
  });

  it('should render Outlet component when token is present and not empty', () => {
    const store = createMockStore('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    const { getByTestId } = renderWithProvider(store);

    const outletElement = getByTestId('outlet');
    expect(outletElement).toBeInTheDocument();
    expect(outletElement).toHaveTextContent('Outlet Content');
  });

  it('should not render Navigate when token is present', () => {
    const store = createMockStore('valid-token');
    const { queryByTestId } = renderWithProvider(store);

    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should not render Outlet when token is not present', () => {
    const store = createMockStore(null);
    const { queryByTestId } = renderWithProvider(store);

    expect(queryByTestId('outlet')).not.toBeInTheDocument();
  });
});
