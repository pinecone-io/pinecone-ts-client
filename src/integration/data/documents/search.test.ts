import { Index, Pinecone, SearchDocumentsResponse } from '../../../index';
import { globalNamespaceOne, assertWithRetries } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone,
  serverlessIndex: Index,
  vectorField: string,
  metadataKey: string,
  metadataValue: any;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  vectorField = fixtures.serverlessIndex.vectorFieldName;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });

  metadataKey = fixtures.serverlessIndex.metadataFilter.key;
  metadataValue = fixtures.serverlessIndex.metadataFilter.value;
});

// NOTE: `searchDocuments` scores against supplied vector values and has no
// query-by-id form. The vectors API's `query({ id })` has no equivalent in the
// documents API and is intentionally not covered here.
describe('searchDocuments tests on serverless index', () => {
  // Prod answers `dense_vector` scoring on 2026-07 with HTTP 200 and an empty
  // `matches` array, even though the seeded namespace demonstrably holds 11
  // documents. The mode is in the spec and the SDK supports it, but the fleet
  // doesn't serve it for schema-based indexes yet. Un-skip when it rolls out;
  // see pinecone-ts-client-internal#92.
  test.skip('search with vector values', async () => {
    const topK = 1;

    await assertWithRetries(
      () =>
        serverlessIndex.searchDocuments({
          scoreBy: [
            { type: 'dense_vector', field: vectorField, values: [0.11, 0.22] },
          ],
          topK,
        }),
      (results: SearchDocumentsResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches.length).toEqual(topK);
        expect(results.usage).toBeDefined();
      },
      240000,
    );
  });

  // Skipped for the same fleet gap as above; see
  // pinecone-ts-client-internal#92.
  test.skip('search when topK is greater than number of documents', async () => {
    const topK = 20; // the shared fixture seeds the serverless index with 11 documents

    await assertWithRetries(
      () =>
        serverlessIndex.searchDocuments({
          scoreBy: [
            { type: 'dense_vector', field: vectorField, values: [0.11, 0.22] },
          ],
          topK,
        }),
      (results: SearchDocumentsResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches.length).toEqual(11);
        expect(results.usage).toBeDefined();
      },
    );
  });

  // Skipped for the same fleet gap as above; see
  // pinecone-ts-client-internal#92.
  //
  // The zero-match assertion below needs the positive control ahead of it: on
  // its own it passes just as happily against a namespace that returns nothing
  // for every query, which is exactly what #92 describes. The control uses the
  // fixture's own metadata filter (`metadataFilter` in `src/integration/setup.ts`,
  // taken from the first seeded document), so it is guaranteed to match at
  // least one document whenever search works at all. The whole test therefore
  // stays skipped until #92 clears — the fixture index declares only a
  // `dense_vector` field, so there is no other scoring mode to control with.
  test.skip('with a filter matching nothing, returns empty results', async () => {
    await assertWithRetries(
      () =>
        serverlessIndex.searchDocuments({
          scoreBy: [
            { type: 'dense_vector', field: vectorField, values: [0.11, 0.22] },
          ],
          topK: 2,
          filter: { [metadataKey]: { $eq: metadataValue } },
        }),
      (results: SearchDocumentsResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches.length).toBeGreaterThan(0);
      },
    );

    await assertWithRetries(
      () =>
        serverlessIndex.searchDocuments({
          scoreBy: [
            { type: 'dense_vector', field: vectorField, values: [0.11, 0.22] },
          ],
          topK: 2,
          filter: { genre: { $eq: 'no-such-genre' } },
        }),
      (results: SearchDocumentsResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches.length).toEqual(0);
      },
    );
  });

  // Skipped for the same fleet gap as above; see
  // pinecone-ts-client-internal#92.
  test.skip('search with includeFields returns the requested fields', async () => {
    const queryVec = Array.from({ length: 2 }, () => Math.random());

    await assertWithRetries(
      () =>
        serverlessIndex.searchDocuments({
          scoreBy: [
            { type: 'dense_vector', field: vectorField, values: queryVec },
          ],
          topK: 2,
          includeFields: [vectorField, 'genre'],
        }),
      (results: SearchDocumentsResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches.length).toEqual(2);
        expect(results.matches[0]._id).toBeDefined();
        expect(results.matches[0]._score).toBeDefined();
        expect(results.usage).toBeDefined();
      },
      240000,
    );
  });
});
