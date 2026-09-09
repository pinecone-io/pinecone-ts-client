import { Pinecone } from '../../../index';
import {
  assertWithRetries,
  randomName,
  retryDeletes,
} from '../../test-helpers';

// This public parquet fixture serves legacy vector indexes. Document import
// still needs a separate JSONL fixture tracked in #38.
const testURI = 's3://dev-bulk-import-datasets-pub/10-records-dim-10/';
// The fixture contains ten records in EACH of two namespaces.
const expectedRecordCount = 20;

describe('legacy vector bulk import', () => {
  const runImport = async (awaitCompletion: boolean) => {
    const pc = new Pinecone();
    const indexName = randomName('bulk-import-integration-test');
    try {
      await pc.indexes.create({
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
        timeout: 180_000,
      });
      const index = pc.index({ name: indexName });
      const response = await index.startImport({ uri: testURI });
      expect(response.id).toEqual(expect.any(String));
      expect(response.id!.length).toBeGreaterThan(0);
      const id = response.id!;
      const description = await index.describeImport(id);
      expect(description).toMatchObject({ id, uri: testURI });
      expect(['Pending', 'InProgress', 'Completed']).toContain(
        description.status,
      );
      await assertWithRetries(
        () => index.listImports(),
        (list) => {
          // This index belongs exclusively to this test and has exactly one job.
          expect(list.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id, uri: testURI }),
            ]),
          );
        },
      );
      if (awaitCompletion) {
        // Import completion can take minutes even for tiny datasets.
        await assertWithRetries(
          () => index.describeImport(id),
          (job) => {
            expect(job).toMatchObject({
              id,
              uri: testURI,
              status: 'Completed',
              recordsImported: expectedRecordCount,
            });
          },
          1_800_000,
          5000,
        );
        await assertWithRetries(
          () => index.describeIndexStats(),
          (stats) => {
            expect(stats.totalRecordCount).toBe(expectedRecordCount);
            expect(stats.namespaces).toMatchObject({
              namespace1: { recordCount: 10 },
              namespace2: { recordCount: 10 },
            });
          },
        );
      } else {
        // The default matrix exercises cancellation without waiting for completion.
        await index.cancelImport(id);
      }
    } finally {
      await retryDeletes(pc, indexName);
    }
  };

  test('starts, describes, lists and cancels a parquet import', () =>
    runImport(false));
  // @integration-skip #38: full import completion has variable latency and requires explicit long-run opt-in.
  const testFullImport =
    process.env.PINECONE_LONG_RUNNING_INTEGRATION === '1' ? test : test.skip;
  testFullImport(
    'completes a parquet import and exposes both ten-record namespaces',
    () => runImport(true),
    2_700_000,
  );
});
