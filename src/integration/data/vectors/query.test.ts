import { Index, Pinecone, QueryResponse } from '../../../index';
import {
  globalNamespaceOne,
  getRecordIds,
  assertWithRetries,
} from '../../test-helpers';
import { getTestContext } from '../../test-context';

let pinecone: Pinecone,
  serverlessIndex: Index,
  recordIds: Array<string> | undefined;

beforeAll(async () => {
  const fixtures = await getTestContext();
  pinecone = fixtures.client;

  serverlessIndex = pinecone.index({
    name: fixtures.serverlessIndex.name,
    namespace: globalNamespaceOne,
  });
  recordIds = await getRecordIds(serverlessIndex);
});

describe('query tests on serverless index', () => {
  test('query by id', async () => {
    const topK = 4;
    if (recordIds) {
      if (recordIds.length > 0) {
        const idForQuerying = recordIds[0];

        await assertWithRetries(
          () => serverlessIndex.query({ id: idForQuerying, topK: 4 }),
          (results: QueryResponse) => {
            expect(results.matches).toBeDefined();
            expect(results.matches?.length).toEqual(topK);
            // Necessary to avoid could-be-undefined error for `usage` field:
            if (results.usage) {
              expect(results.usage.readUnits).toBeDefined();
            }
          },
        );
      }
    }
  });

  test('query when topK is greater than number of records', async () => {
    const topK = 11; // in shared-fixtures-singleton.ts, we seed the serverless index w/11 records
    if (recordIds) {
      const idForQuerying = recordIds[1];

      await assertWithRetries(
        () => serverlessIndex.query({ id: idForQuerying, topK: topK }),
        (results: QueryResponse) => {
          expect(results.matches).toBeDefined();
          expect(results.matches?.length).toEqual(11); // expect 11 records to be returned
          // Necessary to avoid could-be-undefined error for `usage` field:
          if (results.usage) {
            expect(results.usage.readUnits).toBeDefined();
          }
        },
      );
    }
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;
    await assertWithRetries(
      () => serverlessIndex.query({ id: '12354523423', topK }),
      (results: QueryResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches?.length).toEqual(0);
      },
    );
  });

  test('query with vector values', async () => {
    const topK = 1;

    await assertWithRetries(
      () =>
        serverlessIndex.query({
          vector: [0.11, 0.22],
          topK,
        }),
      (results: QueryResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches?.length).toEqual(topK);
        if (results.usage) {
          expect(results.usage.readUnits).toBeDefined();
        }
      },
      240000,
    );
  });

  test('query with includeValues: true', async () => {
    const queryVec = Array.from({ length: 2 }, () => Math.random());

    await assertWithRetries(
      () =>
        serverlessIndex.query({
          vector: queryVec,
          topK: 2,
          includeValues: true,
          includeMetadata: true,
        }),
      (results: QueryResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches?.length).toEqual(2);
        // Necessary to avoid could-be-undefined error for `usage` field:
        if (results.usage) {
          expect(results.usage.readUnits).toBeDefined();
        }
      },
      240000,
    );
  });
});
