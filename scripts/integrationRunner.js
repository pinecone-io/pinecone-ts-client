// File used by "test:integration-local:$TEST_ENV" commands in package.json

const { execSync } = require('child_process');

let SERVERLESS_INDEX_NAME;
let ASSISTANT_NAME;
let TEST_FILE;

try {
  // Step 1: Run setup script and capture SERVERLESS_INDEX_NAME
  console.log('Running setup script');
  const setupOutput = execSync('npx ts-node ./src/integration/setup.ts', {
    encoding: 'utf-8',
  });
  SERVERLESS_INDEX_NAME = setupOutput.match(/SERVERLESS_INDEX_NAME=(\S+)/)[1];
  ASSISTANT_NAME = setupOutput.match(/ASSISTANT_NAME=(\S+)/)[1];
  TEST_FILE = setupOutput.match(/TEST_FILE=(\S+)/)[1];

  const TEST_ENV = process.env.TEST_ENV || 'node';

  // Step 2: Run Jest tests
  console.log(`Executing integration tests in Jest environment: "${TEST_ENV}"`);
  execSync(
    `SERVERLESS_INDEX_NAME=${SERVERLESS_INDEX_NAME} ASSISTANT_NAME=${ASSISTANT_NAME} TEST_FILE=${TEST_FILE} TEST_ENV=${TEST_ENV} jest src/integration -c jest.config.integration-node.js --detectOpenHandles --runInBand --bail --forceExit`,
    { stdio: 'inherit' }
  );
} catch (error) {
  console.log(`Setup script failed with error: ${JSON.stringify(error)}`);
  console.error(error.stdout?.toString() || 'No stdout');
  console.error(error.stderr?.toString() || 'No stderr');
  process.exit(1); // Ensure the script fails visibly in CI/CD
} finally {
  // Step 3: Pass SERVERLESS_INDEX_NAME and ASSISTANT_NAME to teardown script, ensuring teardown runs even if tests fail
  if (SERVERLESS_INDEX_NAME && ASSISTANT_NAME && TEST_FILE) {
    console.log('Running teardown script');
    execSync(
      `SERVERLESS_INDEX_NAME=${SERVERLESS_INDEX_NAME} ASSISTANT_NAME=${ASSISTANT_NAME} TEST_FILE=${TEST_FILE} npx ts-node ./src/integration/teardown.ts`,
      { stdio: 'inherit' }
    );
    process.exit(0);
  } else {
    console.warn(
      'Either SERVERLESS_INDEX_NAME or ASSISTANT_NAME or TEST_FILE is undefined. Teardown script may not behave as' +
        ' expected.'
    );
    process.exit(1);
  }
}
