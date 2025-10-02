import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock react-router-dom components
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
        <div data-testid="navigate" data-to={to} data-replace={replace}>
            Navigate to {to}
        </div>
    ),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

const createMockStore = (initialState = {}) => ({
    getState: () => ({
        auth: { token: null },
        ...initialState,
    }),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
} as any);

const renderWithProvider = (store: any) => {
    return render(
        <Provider store={store}>
            <BrowserRouter>
                <ProtectedRoute />
            </BrowserRouter>
        </Provider>
    );
};

describe('ProtectedRoute', () => {
    it('should render Navigate component when no token is present', () => {
        const store = createMockStore();
        renderWithProvider(store);

        const navigateElement = screen.getByTestId('navigate');
        expect(navigateElement).toBeInTheDocument();
        expect(navigateElement).toHaveAttribute('data-to', '/login');
        expect(navigateElement).toHaveAttribute('data-replace', 'true');
    });

    it('should render Outlet component when token is present', () => {
        const store = createMockStore({
            auth: { token: 'valid-token' }
        });
        renderWithProvider(store);

        const outletElement = screen.getByTestId('outlet');
        expect(outletElement).toBeInTheDocument();
        expect(outletElement).toHaveTextContent('Outlet Content');
    });

    it('should render Navigate component when token is empty string', () => {
        const store = createMockStore({
            auth: { token: '' }
        });
        renderWithProvider(store);

        const navigateElement = screen.getByTestId('navigate');
        expect(navigateElement).toBeInTheDocument();
        expect(navigateElement).toHaveAttribute('data-to', '/login');
    });

    it('should render Navigate component when token is null', () => {
        const store = createMockStore({
            auth: { token: null }
        });
        renderWithProvider(store);

        const navigateElement = screen.getByTestId('navigate');
        expect(navigateElement).toBeInTheDocument();
        expect(navigateElement).toHaveAttribute('data-to', '/login');
    });

    it('should render Navigate component when token is undefined', () => {
        const store = createMockStore({
            auth: { token: undefined }
        });
        renderWithProvider(store);

        const navigateElement = screen.getByTestId('navigate');
        expect(navigateElement).toBeInTheDocument();
        expect(navigateElement).toHaveAttribute('data-to', '/login');
    });

    it('should render Outlet component when token is a valid string', () => {
        const store = createMockStore({
            auth: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' }
        });
        renderWithProvider(store);

        const outletElement = screen.getByTestId('outlet');
        expect(outletElement).toBeInTheDocument();
        expect(outletElement).toHaveTextContent('Outlet Content');
    });

    it('should use useSelector to get auth token', () => {
        const store = createMockStore({
            auth: { token: 'test-token' }
        });
        renderWithProvider(store);

        // Should render outlet when token exists
        const outletElement = screen.getByTestId('outlet');
        expect(outletElement).toBeInTheDocument();
    });

    it('should handle token changes correctly', () => {
        // Test with no token first
        const store = createMockStore();
        const { rerender } = renderWithProvider(store);

        expect(screen.getByTestId('navigate')).toBeInTheDocument();

        // Update store with token
        const storeWithToken = createMockStore({
            auth: { token: 'new-token' }
        });

        rerender(
            <Provider store={storeWithToken}>
                <BrowserRouter>
                    <ProtectedRoute />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
});
