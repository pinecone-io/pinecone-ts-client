module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    ['github-actions', { silent: false }],
    'jest-progress-bar-reporter',
  ],
  setupFilesAfterEnv: ['./scripts/globalUnitTestSetup.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['src/integration', 'dist/'],
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
