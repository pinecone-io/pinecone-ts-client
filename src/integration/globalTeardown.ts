/**
 * Global teardown runs once after ALL test files have completed.
 * It accesses the shared FixtureManager from the custom environment.
 */
export default async function globalTeardown() {
  try {
    const { getSharedFixtureManager } = await import(
      './custom-jest-environment'
    );
    const sharedManager = getSharedFixtureManager();

    if (sharedManager) {
      await sharedManager.cleanup();
    }
  } catch (error) {
    console.error('Error during teardown:', error);
    // Don't throw - we want tests to report their own status
  }
}
