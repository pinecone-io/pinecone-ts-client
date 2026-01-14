module.exports = {
  preset: 'ts-jest',
  testEnvironment: './src/integration/custom-jest-environment.ts',
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
  globalTeardown: './src/integration/globalTeardown.ts',
  testPathIgnorePatterns: [],
  testTimeout: 600000,
  verbose: true,
  detectOpenHandles: true,
  resetModules: false,
};
