import { Pinecone, Index } from '../../../index';
import { randomName, retryDeletes } from '../../test-helpers';

// DISABLED: the public test dataset at `testURI` is parquet-formatted, which is
// not supported for schema-based (document) indexes. Bulk import for these
// indexes needs a JSONL payload, and the replacement dataset is not yet in
// place. Re-enable once the bucket is re-pointed at a JSONL fixture.
//
// `describe.skip` (rather than commenting out the test body) also skips the
// `beforeAll`/`afterAll` hooks, so no index is created and left orphaned.
describe.skip('bulk import', () => {
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
          embedding: { type: 'dense_vector', dimension: 10, metric: 'cosine' },
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
    expect(response.id).toBeDefined();
  });
});
