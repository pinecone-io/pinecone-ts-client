import { Index, Pinecone, SearchDocumentsResponse } from '../../../index';
import { globalNamespaceOne, assertWithRetries } from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone, serverlessIndex: Index, vectorField: string;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;
  vectorField = fixtures.serverlessIndex.vectorFieldName;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });
});

// NOTE: `searchDocuments` scores against supplied vector values and has no
// query-by-id form. The vectors API's `query({ id })` has no equivalent in the
// documents API and is intentionally not covered here.
describe('searchDocuments tests on serverless index', () => {
  test('search with vector values', async () => {
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

  test('search when topK is greater than number of documents', async () => {
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

  test('with a filter matching nothing, returns empty results', async () => {
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

  test('search with includeFields returns the requested fields', async () => {
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
