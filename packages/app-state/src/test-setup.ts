import '@testing-library/jest-dom'

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
})

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
    value: {
        meta: {
            env: {
                VITE_API_URL: 'http://localhost:3000/api',
            },
        },
    },
    writable: true,
})

// Suppress console warnings
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeAll(() => {
    console.warn = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning:') || args[0].includes('Deprecation'))
        ) {
            return
        }
        originalConsoleWarn.call(console, ...args)
    }

    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return
        }
        originalConsoleError.call(console, ...args)
    }
})

afterAll(() => {
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
})
