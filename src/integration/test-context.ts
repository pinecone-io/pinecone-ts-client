import { Pinecone } from '../index';

/**
 * Integration test fixtures interface
 */
export interface IntegrationFixtures {
  client: Pinecone;
  serverlessIndex: {
    name: string;
    dimension: number;
    metric: string;
  };
  assistant: {
    name: string;
    testFilePath: string;
  };
}

/**
 * Parses the FIXTURES_JSON environment variable and returns a typed IntegrationFixtures object.
 * The FIXTURES_JSON environment variable should be set by running the setup script first:
 *
 * Use the convenience script that does everything:
 * ```bash
 * npm run test:integration:local
 * ```
 *
 * Or run the setup script manually:
 * ```bash
 * npm run integration:setup
 * export FIXTURES_JSON='...'  # Copy from setup output
 * npm run test:integration:node
 * ```
 *
 * @example
 * ```typescript
 * import { getTestContext } from '../test-context';
 *
 * let fixtures: IntegrationFixtures;
 *
 * beforeAll(async () => {
 *   fixtures = await getTestContext();
 * });
 *
 * test('example', () => {
 *   const index = fixtures.client.index({
 *     name: fixtures.serverlessIndex.name,
 *     namespace: 'my-namespace',
 *   });
 * });
 * ```
 */
export const getTestContext = async (): Promise<IntegrationFixtures> => {
  const fixturesJson = process.env.FIXTURES_JSON;

  if (!fixturesJson) {
    throw new Error(
      'FIXTURES_JSON environment variable not set.\n\n' +
        'Run the setup script first:\n' +
        '  npm run integration:setup\n\n' +
        'Then export the FIXTURES_JSON value from the output, or use:\n' +
        '  npm run test:integration:local\n'
    );
  }

  let data;
  try {
    data = JSON.parse(fixturesJson);
  } catch (error) {
    throw new Error(
      `Failed to parse FIXTURES_JSON: ${error}\n` +
        `Value: ${fixturesJson.substring(0, 100)}...`
    );
  }

  // Validate required fields
  if (!data.serverlessIndex?.name) {
    throw new Error('FIXTURES_JSON missing serverlessIndex.name');
  }
  if (!data.assistant?.name) {
    throw new Error('FIXTURES_JSON missing assistant.name');
  }

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }

  // Create Pinecone client
  const client = new Pinecone({ apiKey });

  return {
    client,
    serverlessIndex: {
      name: data.serverlessIndex.name,
      dimension: data.serverlessIndex.dimension || 2,
      metric: data.serverlessIndex.metric || 'dotproduct',
    },
    assistant: {
      name: data.assistant.name,
      testFilePath: data.assistant.testFilePath || '',
    },
  };
};
