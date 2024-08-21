// const config = require('./jest.config');
//
// module.exports = {
//   ...config,
//   reporters: [['github-actions', { silent: false }], 'default'],
//   setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
//   testPathIgnorePatterns: [],
//   testEnvironment: 'node',
// };

import config from './jest.config';

export default {
  ...config,
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
};
