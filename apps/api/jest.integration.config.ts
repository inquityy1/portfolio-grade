export default {
    displayName: 'api-integration',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../coverage/api-integration',
    testMatch: [
        '<rootDir>/src/integration/**/*.spec.ts',
        '<rootDir>/src/integration/**/*.test.ts',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/src/(?!integration).*',
    ],
    moduleNameMapper: {
        '^apps/api/src/(.*)$': '<rootDir>/src/$1',
        '^@portfolio-grade/shared$': '<rootDir>/../../packages/shared/src/index.ts',
        '^@portfolio-grade/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/src/integration/test-setup.ts'],
    testTimeout: 30000, // 30 seconds for integration tests
    maxWorkers: 1, // Run integration tests sequentially to avoid database conflicts
};
