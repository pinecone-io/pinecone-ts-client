// Local/manual use only -- not run in CI (see #54). This patches Edge
// globals onto an ordinary Node process and test files still load through
// Jest's own Node-based module resolution, so it cannot catch a Node
// built-in dependency the way scripts/edge-runtime/loadEntryInEdgeVM.ts
// does, and no integration assertion here observes the one behavior that
// does differ (buildUserAgent's "Edge Runtime" tag).
const config = require('./jest.config.integration-node');

module.exports = {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
