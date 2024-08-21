import config from './jest.config.js';

export default {
  ...config,
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
};
