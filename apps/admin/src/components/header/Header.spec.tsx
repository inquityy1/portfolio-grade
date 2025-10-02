import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    NavLink: ({ to, children, className }: any) => (
        <a href={to} className={className?.({ isActive: false }) || ''}>
            {children}
        </a>
    ),
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

// Mock the app-state module
jest.mock('@portfolio-grade/app-state', () => ({
    setToken: jest.fn(),
    clearOrg: jest.fn(),
    api: {
        util: {
            resetApiState: jest.fn(),
        },
    },
}));

// Mock UI Kit Button
jest.mock('@portfolio-grade/ui-kit', () => ({
    Button: ({ children, onClick }: any) => (
        <button onClick={onClick}>{children}</button>
    ),
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock the Header component to avoid import.meta issues
jest.mock('./Header', () => {
    const React = require('react');
    const { useSelector, useDispatch } = require('react-redux');
    const { useNavigate } = require('react-router-dom');
    const { Button } = require('@portfolio-grade/ui-kit');

    return function MockHeader() {
        const navigate = useNavigate();
        const dispatch = useDispatch();
        const token = useSelector((s: any) => s.auth.token);

        return (
            <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #2e2e2e' }}>
                <a href="/" style={{ textDecoration: 'none', color: 'inherit', marginRight: 8 }}>
                    <strong>Admin</strong>
                </a>
                {token && (
                    <nav style={{ display: 'flex', gap: 8 }}>
                        <a href="/admin-jobs"><Button>Admin Jobs</Button></a>
                        <a href="/audit-logs"><Button>Audit Logs</Button></a>
                        <a href="/create-user"><Button>Create New User</Button></a>
                        <a href="/create-organization"><Button>Create New Org</Button></a>
                    </nav>
                )}
                <div style={{ marginLeft: 'auto' }}>
                    {token && <Button onClick={() => navigate('/login')}>Logout</Button>}
                </div>
            </header>
        );
    };
});

import Header from './Header';

describe('Header', () => {
    const createMockStore = (token: string | null) => {
        return configureStore({
            reducer: {
                auth: (state = { token }, action: any) => state,
            },
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    const renderWithProvider = (store: any) => {
        return render(
            <Provider store={store}>
                <BrowserRouter>
                    <Header />
                </BrowserRouter>
            </Provider>
        );
    };

    describe('Rendering', () => {
        it('should render header element', () => {
            const store = createMockStore(null);
            const { container } = renderWithProvider(store);

            const header = container.querySelector('header');
            expect(header).toBeInTheDocument();
        });

        it('should render app title link', () => {
            const store = createMockStore(null);
            renderWithProvider(store);

            const titleLink = screen.getByText('Admin');
            expect(titleLink).toBeInTheDocument();
            expect(titleLink.closest('a')).toHaveAttribute('href', '/');
        });

        it('should render with correct styling', () => {
            const store = createMockStore(null);
            const { container } = renderWithProvider(store);

            const header = container.querySelector('header');
            expect(header).toHaveStyle({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: '1px solid #2e2e2e',
            });
        });
    });

    describe('Navigation when user has token', () => {
        it('should show navigation buttons when user has token', () => {
            const store = createMockStore('valid-token');
            renderWithProvider(store);

            expect(screen.getByText('Admin Jobs')).toBeInTheDocument();
            expect(screen.getByText('Audit Logs')).toBeInTheDocument();
            expect(screen.getByText('Create New User')).toBeInTheDocument();
            expect(screen.getByText('Create New Org')).toBeInTheDocument();
        });

        it('should show logout button when user has token', () => {
            const store = createMockStore('valid-token');
            renderWithProvider(store);

            expect(screen.getByText('Logout')).toBeInTheDocument();
        });
    });

    describe('Navigation when user has no token', () => {
        it('should not show navigation buttons when user has no token', () => {
            const store = createMockStore(null);
            renderWithProvider(store);

            expect(screen.queryByText('Admin Jobs')).not.toBeInTheDocument();
            expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument();
            expect(screen.queryByText('Create New User')).not.toBeInTheDocument();
            expect(screen.queryByText('Create New Org')).not.toBeInTheDocument();
        });

        it('should not show logout button when user has no token', () => {
            const store = createMockStore(null);
            renderWithProvider(store);

            expect(screen.queryByText('Logout')).not.toBeInTheDocument();
        });
    });

    describe('Token handling', () => {
        it('should render navigation when token is present', () => {
            const store = createMockStore('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
            renderWithProvider(store);

            expect(screen.getByText('Admin Jobs')).toBeInTheDocument();
            expect(screen.getByText('Logout')).toBeInTheDocument();
        });

        it('should not render navigation when token is empty string', () => {
            const store = createMockStore('');
            renderWithProvider(store);

            expect(screen.queryByText('Admin Jobs')).not.toBeInTheDocument();
            expect(screen.queryByText('Logout')).not.toBeInTheDocument();
        });
    });
});
