module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./src/integration/jest-setup.ts'],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        isolatedModules: false,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  testPathIgnorePatterns: [],
  testTimeout: 600000, // 10 minutes
  verbose: true,
  detectOpenHandles: true,
  resetModules: false,
};
