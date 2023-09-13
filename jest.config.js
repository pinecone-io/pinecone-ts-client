module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalUnitTestSetup.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['src/integration'],
  testTimeout: 100000,
  verbose: true,
  detectOpenHandles: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!**/src/pinecone-generated-ts-fetch/**',
    '!**/src/v0/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
