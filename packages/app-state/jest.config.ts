module.exports = {
    displayName: 'app-state',
    preset: '../../jest.preset.js',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/app-state',
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
}
