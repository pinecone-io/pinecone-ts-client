import { Index } from '../../../data';
import type { FetchDocumentsResponse } from '../../../index';
import { Pinecone } from '../../../pinecone';
import { assertWithRetries, globalNamespaceOne } from '../../test-helpers';
import { getTestContext } from '../../test-context';

// `fetchByMetadata` folded into `fetchDocuments`, which accepts either `ids` or
// a `filter`. Document metadata lives in top-level fields rather than under a
// nested `metadata` object.
let pinecone: Pinecone,
  serverlessIndex: Index,
  metadataKey: string,
  metadataValue: any;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });

  metadataKey = fixtures.serverlessIndex.metadataFilter.key;
  metadataValue = fixtures.serverlessIndex.metadataFilter.value;
});

describe('fetchDocuments by filter', () => {
  // Reads here are read-your-writes eventual, like every other document read
  // in this directory, so re-poll rather than asserting on a single call.
  test('fetch by metadata filter', async () => {
    await assertWithRetries(
      () =>
        serverlessIndex.fetchDocuments({
          filter: { [metadataKey]: { $eq: metadataValue } },
          includeFields: [metadataKey],
        }),
      (result: FetchDocumentsResponse) => {
        const documents = Object.values(result.documents);
        expect(documents.length).toBeGreaterThan(0);
        documents.forEach((doc) => {
          expect(doc).toMatchObject({ [metadataKey]: metadataValue });
        });
      },
    );
  });
});
