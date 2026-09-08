// Local use only, not run in CI (#54): this patches Edge globals onto a Node
// process but still loads modules through Node, so it cannot catch a Node
// built-in dependency. scripts/edge-runtime/loadEntryInEdgeVM.ts does.
const config = require('./jest.config.integration-node');

module.exports = {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
