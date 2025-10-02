import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

// Mock Header component
jest.mock('../header/Header', () => {
    return function MockHeader() {
        return <div data-testid="header">Header Component</div>;
    };
});

// Mock Outlet component
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

describe('Layout', () => {
    it('should render Header component', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Outlet component', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should have proper structure with header and main content', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        const header = screen.getByTestId('header');
        const outlet = screen.getByTestId('outlet');

        expect(header).toBeInTheDocument();
        expect(outlet).toBeInTheDocument();
    });

    it('should apply correct styling to main element', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        const mainElement = screen.getByTestId('outlet').closest('main');
        expect(mainElement).toBeInTheDocument();
        expect(mainElement).toHaveStyle('padding: 24px');
    });

    it('should render both Header and Outlet in correct order', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        const header = screen.getByTestId('header');
        const outlet = screen.getByTestId('outlet');

        expect(header).toBeInTheDocument();
        expect(outlet).toBeInTheDocument();

        // Check that header comes before outlet in the DOM
        const container = header.parentElement;
        const children = Array.from(container?.children || []);
        const headerIndex = children.indexOf(header);

        // Find the main element that contains the outlet
        const mainElement = children.find(child => child.tagName === 'MAIN');
        const outletIndex = mainElement ? children.indexOf(mainElement) : -1;

        // Ensure we found both elements
        expect(headerIndex).toBeGreaterThanOrEqual(0);
        expect(outletIndex).toBeGreaterThanOrEqual(0);

        // Header should come before outlet
        expect(headerIndex).toBeLessThan(outletIndex);
    });

    it('should have proper div structure', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        const container = screen.getByTestId('header').parentElement;
        expect(container).toBeInTheDocument();
        expect(container?.tagName).toBe('DIV');
    });

    it('should render without throwing errors', () => {
        expect(() => {
            render(
                <BrowserRouter>
                    <Layout />
                </BrowserRouter>
            );
        }).not.toThrow();
    });

    it('should have main element with correct structure', () => {
        render(
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        );

        const mainElement = screen.getByTestId('outlet').closest('main');
        expect(mainElement).toBeInTheDocument();
        expect(mainElement?.parentElement).toBeInTheDocument();
    });
});
