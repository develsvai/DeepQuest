// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import pluginQuery from '@tanstack/eslint-plugin-query'

const eslintConfig = defineConfig([
  // 1. Next.js core-web-vitals (includes React, React Hooks, jsx-a11y)
  ...nextVitals,

  // 2. TypeScript rules (includes @typescript-eslint)
  ...nextTs,

  // 3. TanStack Query rules
  ...pluginQuery.configs['flat/recommended'],

  // 4. Custom rules
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // General rules
      'no-debugger': 'error',
      'prefer-const': 'error',

      // Prevent direct next/link and next/navigation imports
      // Use @/i18n/navigation instead for automatic locale handling
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Use Link from @/i18n/navigation instead for automatic locale handling.',
            },
            {
              name: 'next/navigation',
              importNames: [
                'useRouter',
                'usePathname',
                'redirect',
                'permanentRedirect',
              ],
              message:
                'Use from @/i18n/navigation instead for automatic locale handling.',
            },
          ],
        },
      ],

      // Next.js specific
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // eslint-plugin-react-hooks 7.x new rules - disabled for existing code compatibility
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/refs': 'off',
    },
  },

  // 5. scripts folder exceptions
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 6. Prettier (must be last to override formatting rules)
  prettier,

  // 7. Global ignores
  globalIgnores([
    '**/*.css',
    '**/*.scss',
    '**/*.sass',
    '**/*.less',
    '.next/**',
    'out/**',
    'node_modules/**',
    '.env*',
    'public/**',
    '*.config.js',
    '*.config.mjs',
    'coverage/**',
    '.vercel/**',
    'prisma/migrations/**',
    'src/generated/**',
    'dist/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
