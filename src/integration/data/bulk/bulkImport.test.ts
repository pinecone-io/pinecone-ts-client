import { Pinecone, Index } from '../../../index';
import {
  assertWithRetries,
  randomName,
  retryDeletes,
} from '../../test-helpers';

// The public fixture is parquet for legacy vector indexes. Reserved _values
// creates a compatible index through 2026-07. Document import still needs a
// separate JSONL fixture, tracked in #38.
describe('legacy vector bulk import', () => {
  let pinecone: Pinecone, index: Index;

  const indexName = randomName('bulk-import-integration-test');
  const testURI = 's3://dev-bulk-import-datasets-pub/10-records-dim-10/';

  beforeAll(async () => {
    pinecone = new Pinecone();
    await pinecone.indexes.create({
      name: indexName,
      deployment: {
        deploymentType: 'managed',
        cloud: 'aws',
        region: 'us-west-2',
      },
      schema: {
        fields: {
          _values: { type: 'dense_vector', dimension: 10, metric: 'cosine' },
        },
      },
      waitUntilReady: true,
    });

    index = pinecone.index({ name: indexName });
  });

  afterAll(async () => {
    await retryDeletes(pinecone, indexName);
  });

  test('verify bulk import', async () => {
    const response = await index.startImport({ uri: testURI });
    expect(response).toBeDefined();
    expect(response.id).toEqual(expect.any(String));
    expect(response.id!.length).toBeGreaterThan(0);
    await assertWithRetries(
      () => index.describeImport(response.id!),
      (job) => {
        expect(job).toMatchObject({
          id: response.id,
          uri: testURI,
          status: 'Completed',
          recordsImported: 10,
        });
      },
      600_000,
      5000,
    );
    await assertWithRetries(
      () => index.describeIndexStats(),
      (stats) => {
        expect(stats.totalRecordCount).toBe(10);
      },
    );
  }, 900_000);
});
