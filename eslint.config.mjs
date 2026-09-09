import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'src/pinecone-generated-ts-fetch',
      'src/pinecone-generated-ts-fetch-alpha',
      'pinecone-rag-demo',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: './tsconfig.json' }),
      ],
    },
    rules: {
      semi: ['error', 'always'],
      quotes: 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'import-x/no-cycle': 'error',
    },
  },
  {
    files: ['src/control/indexes/legacyTranslation.ts'],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/control/indexes/legacyTranslation.ts',
              from: './src/data',
            },
            {
              target: './src/control/indexes/legacyTranslation.ts',
              from: './src/pinecone-generated-ts-fetch/db_control/apis',
            },
            {
              target: './src/control/indexes/legacyTranslation.ts',
              from: './src/pinecone-generated-ts-fetch/db_data/apis',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/preview/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
    },
  },
);
