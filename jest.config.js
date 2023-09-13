module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [['github-actions', { silent: false }], 'default'],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testTimeout: 100000,
  verbose: true,
  detectOpenHandles: false,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!**/src/pinecone-generated-ts-fetch/**',
    '!**/src/v0/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
