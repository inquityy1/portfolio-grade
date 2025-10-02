import '@testing-library/jest-dom';

// Suppress React Router deprecation warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('React Router Future Flag Warning') ||
            args[0].includes('v7_startTransition') ||
            args[0].includes('v7_relativeSplatPath'))
    ) {
        return;
    }
    originalConsoleWarn(...args);
};

// Suppress React act warnings
const originalConsoleError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('An update to MockHeader inside a test was not wrapped in act') ||
            args[0].includes('When testing, code that causes React state updates should be wrapped into act'))
    ) {
        return;
    }
    originalConsoleError(...args);
};

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
