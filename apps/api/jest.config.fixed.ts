export default {
    displayName: 'api',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../coverage/api',
    testMatch: [
        '<rootDir>/src/**/*.spec.ts',
        '<rootDir>/src/**/tests/**/*.spec.ts',
        '<rootDir>/src/**/*.test.ts',
        '<rootDir>/src/**/tests/**/*.test.ts',
    ],
    moduleNameMapping: {
        '^apps/api/src/(.*)$': '<rootDir>/src/$1',
    },
};
