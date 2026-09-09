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

// Prod returns HTTP 200 with zero documents for a filter whose key and value
// are taken from a seeded document's own metadata, on every leg of runs
// 34309471173 and 34309877987 (2026-09-09) — the second of which re-polls for
// the full `assertWithRetries` window, so this is not freshness lag.
//
// Note this is not the 5xx originally reported: the request is accepted and
// answered with nothing. svc-docs-api validates the filter and forwards it,
// and query-router has implemented fetch-by-metadata since 2026-08-03
// (verified in pinecone-db at 8a4bfa3b10), so the request the SDK sends is
// correct and there is no client-side fix. Un-skip when the read path returns
// matches.
describe.skip('fetchDocuments by filter', () => {
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
