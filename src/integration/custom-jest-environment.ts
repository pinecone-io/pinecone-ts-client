import NodeEnvironment from 'jest-environment-node';
import { FixtureManager } from './shared-fixtures-singleton';

// This module-level variable persists across all test file environments
// because Jest loads this environment module once and reuses it
let sharedFixtureManager: FixtureManager | null = null;

class CustomIntegrationEnvironment extends NodeEnvironment {
  constructor(config: any, context: any) {
    super(config, context);

    // Initialize the singleton once for all test files
    if (!sharedFixtureManager) {
      sharedFixtureManager = new FixtureManager();
    }

    // Bridge to test context: Store reference in global scope
    // Tests access via global function, teardown can import directly
    this.global.getSharedFixtureManager = () => sharedFixtureManager;
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
}

export default CustomIntegrationEnvironment;

// Export for globalTeardown (which runs in a different context)
export const getSharedFixtureManager = () => sharedFixtureManager;
