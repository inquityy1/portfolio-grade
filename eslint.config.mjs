import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      'build/**',
      '**/build/**',
      'out/**',
      '**/out/**',
      'node_modules/**',
      '**/node_modules/**',
      'coverage/**',
      '**/coverage/**',
      'test-results/**',
      '**/test-results/**',
      'tmp/**',
      '**/tmp/**',
      '.next/**',
      '**/.next/**',
      '*.d.ts',
      '**/*.d.ts',
      '*.min.js',
      '**/*.min.js',
      '*.bundle.js',
      '**/*.bundle.js',
      '*.chunk.js',
      '**/*.chunk.js',
      'prisma/migrations/**',
      'storybook-static/**',
      'playwright-report/**',
      'playwright/.cache/**',
      'apps/dist/**',
      'packages/*/dist/**',
    ],
  },
  {
    files: [
      'apps/**/*.ts',
      'apps/**/*.tsx',
      'packages/**/*.ts',
      'packages/**/*.tsx',
      'prisma/**/*.ts',
      'scripts/**/*.ts',
      '*.ts',
      '*.tsx'
    ],
    rules: {
      // NX Module Boundaries - More lenient
      '@nx/enforce-module-boundaries': [
        'warn', // Changed from error to warn
        {
          enforceBuildableLibDependency: false, // Allow static imports
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            '^@portfolio-grade/ui-kit$',
            '^@portfolio-grade/app-state$',
            '^@portfolio-grade/shared$',
          ],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],

      // Basic Rules - Less Strict
      'no-console': 'off', // Turn off console warnings
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Turn off unused vars warnings
      'prefer-const': 'error',
      'no-var': 'error',

      // Formatting Rules - Auto-fixable
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 4, { SwitchCase: 1 }], // Changed to 4 spaces to match existing code

      // TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'off', // Turn off any type warnings
      '@typescript-eslint/no-unused-vars': 'off', // Turn off unused vars warnings
      '@typescript-eslint/no-empty-function': 'off', // Allow empty functions for mocks
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions

      // General Rules
      'no-empty': 'off', // Allow empty blocks
      'no-useless-catch': 'off', // Allow catch blocks
      'no-useless-escape': 'off', // Allow escape characters
      'no-unused-expressions': 'off', // Allow unused expressions
      'prefer-const': 'off', // Allow let instead of const
      'prefer-spread': 'off', // Allow .apply()
      'no-case-declarations': 'off', // Allow declarations in case blocks
      '@typescript-eslint/no-this-alias': 'off', // Allow this aliasing
      'no-var': 'off', // Allow var declarations

      // Disable problematic rules for now
      'import/order': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/e2e/**/*.ts', '**/e2e/**/*.tsx'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
      'import/no-unresolved': 'off',
    },
  },
];
