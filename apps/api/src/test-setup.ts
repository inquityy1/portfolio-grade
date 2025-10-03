// Jest setup for API tests
import 'reflect-metadata';

// Mock environment variables
process.env.NODE_ENV = 'test';

// Suppress console output during tests (optional)
const originalConsole = global.console;
if (typeof globalThis !== 'undefined') {
    globalThis.console = {
        ...originalConsole,
        log: () => { },
        debug: () => { },
        info: () => { },
        warn: () => { },
        error: originalConsole.error,
    } as any;
}