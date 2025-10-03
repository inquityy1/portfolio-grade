export default {
  displayName: 'ui-kit',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        babelConfig: {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-react',
          ],
          plugins: ['babel-plugin-styled-components'],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/packages/ui-kit',
};
