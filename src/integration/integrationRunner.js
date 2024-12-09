// File used by "test:integration-local:$TEST_ENV" commands in package.json

const { execSync } = require('child_process');

let SERVERLESS_INDEX_NAME; // Declare outside the try block

try {
  // Step 1: Run setup script and capture SERVERLESS_INDEX_NAME
  console.log('Running setup script');
  const setupOutput = execSync('npx ts-node ./src/integration/setup.ts', {
    encoding: 'utf-8',
  });
  SERVERLESS_INDEX_NAME = setupOutput.match(/SERVERLESS_INDEX_NAME=(\S+)/)[1];

  const TEST_ENV = process.env.TEST_ENV || 'node';

  // Step 2: Run Jest tests
  console.log(`Executing integration tests in Jest environment: "${TEST_ENV}"`);
  execSync(
    `SERVERLESS_INDEX_NAME=${SERVERLESS_INDEX_NAME} TEST_ENV=${TEST_ENV} jest src/integration -c jest.config.integration-node.js --runInBand --bail`,
    { stdio: 'inherit' }
  );
} finally {
  // Step 3: Pass SERVERLESS_INDEX_NAME to teardown script, ensuring teardown runs even if tests fail
  if (SERVERLESS_INDEX_NAME) {
    console.log('Running teardown script');
    execSync(
      `SERVERLESS_INDEX_NAME=${SERVERLESS_INDEX_NAME} npx ts-node ./src/integration/teardown.ts`,
      { stdio: 'inherit' }
    );
  } else {
    console.warn(
      'SERVERLESS_INDEX_NAME is undefined. Teardown script may not behave as expected.'
    );
  }
}
