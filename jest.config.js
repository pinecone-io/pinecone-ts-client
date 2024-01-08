module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    ['github-actions', { silent: false }],
    'jest-progress-bar-reporter',
    'jest-skipped-reporter',
  ],
  setupFilesAfterEnv: ['./utils/globalUnitTestSetup.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['src/integration'],
  testTimeout: 100000,
  verbose: true,
  detectOpenHandles: false,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!**/src/pinecone-generated-ts-fetch/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
