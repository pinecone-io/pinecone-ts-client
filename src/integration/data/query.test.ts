import { Index, Pinecone, QueryResponse } from '../../index';
import { globalNamespaceOne, serverlessIndexName } from '../test-helpers';

let pinecone: Pinecone, serverlessIndex: Index, recordIds: Array<string>;

// todo: add this to test-helpers
const getRecordIds = async () => {
  const pag = await serverlessIndex.listPaginated();
  const ids: Array<string> = [];
  for (const vector of pag.vectors || []) {
    if (vector.id) {
      ids.push(vector.id);
    } else {
      console.log('No record ID found for vector:', vector);
    }
  }
  console.log('!! Record IDs are: ', ids);
  return ids;
};

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone
    .index(serverlessIndexName)
    .namespace(globalNamespaceOne);
  recordIds = await getRecordIds();
});

// todo: add pod tests
describe('query tests on serverless index', () => {
  test('query by id', async () => {
    if (process.env.RECORD_IDS === undefined) {
      console.log('!! No records found in the environment variable RECORD_IDS');
    }
    const topK = 4;
    if (recordIds.length > 0) {
      const idForQuerying = recordIds[0];

      const assertions = (results: QueryResponse) => {
        expect(results.matches).toBeDefined();
        expect(results.matches?.length).toEqual(topK);
        // Necessary to avoid could-be-undefined error for `usage` field:
        if (results.usage) {
          expect(results.usage.readUnits).toBeDefined();
        }
      };

      assertions(await serverlessIndex.query({ id: idForQuerying, topK: 4 }));
    }
  });

  test('query when topK is greater than number of records', async () => {
    const topK = 11; // in setup.ts, we seed the serverless index w/11 records
    const idForQuerying = recordIds[1];
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(11); // expect 11 records to be returned
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    assertions(await serverlessIndex.query({ id: idForQuerying, topK: topK }));
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(0);
    };

    assertions(await serverlessIndex.query({ id: '12354523423', topK }));
  });

  test('query with vector and sparseVector values', async () => {
    const topK = 1;
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    assertions(
      await serverlessIndex.query({
        vector: [0.11, 0.22],
        sparseVector: {
          indices: [32, 5],
          values: [0.11, 0.22],
        },
        topK,
      })
    );
  });

  test('query with includeValues: true', async () => {
    const queryVec = Array.from({ length: 2 }, () => Math.random());
    const sparseVec = {
      indices: [0, 1],
      values: Array.from({ length: 2 }, () => Math.random()),
    };

    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(2);
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    assertions(
      await serverlessIndex.query({
        vector: queryVec,
        sparseVector: sparseVec,
        topK: 2,
        includeValues: true,
        includeMetadata: true,
      })
    );
  });
});
