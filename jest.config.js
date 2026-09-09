module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    ['github-actions', { silent: false }],
    'jest-progress-bar-reporter',
  ],
  setupFilesAfterEnv: ['./scripts/globalUnitTestSetup.ts'],
  transform: {
    // ts-jest compiles tests as CommonJS regardless of the hybrid `module:
    // nodenext` setting in tsconfig.json; silence its per-file reminder.
    '^.+\\.ts?$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['src/integration', 'src/smoke', 'dist/'],
  testTimeout: 250000,
  verbose: true,
  detectOpenHandles: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!**/src/pinecone-generated-ts-fetch/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
