export default {
  displayName: 'api',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api',
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/tests/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/tests/**/*.test.ts',
  ],
  testPathIgnorePatterns: ['<rootDir>/src/integration/'],
  moduleNameMapper: {
    '^apps/api/src/(.*)$': '<rootDir>/src/$1',
    '^@portfolio-grade/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@portfolio-grade/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
