import { Index, Pinecone, QueryResponse } from '../../index';
import {
  globalNamespaceOne,
  serverlessIndexName,
  recordIDs,
} from '../test-helpers';

let pinecone: Pinecone,
  serverlessIndex: Index,
  serverlessNamespace: Index,
  recordIds: Array<string>;

beforeAll(async () => {
  pinecone = new Pinecone();
  serverlessIndex = pinecone.index(serverlessIndexName);
  serverlessNamespace = serverlessIndex.namespace(globalNamespaceOne);
  recordIds = recordIDs.split(',');
});

// todo: add pod tests
describe('query tests on serverless index', () => {
  test('query by id', async () => {
    const topK = 4;
    const idForQuerying = recordIds[0];

    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(topK);
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
      expect(results.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: idForQuerying })])
      );
    };

    assertions(await serverlessNamespace.query({ id: idForQuerying, topK: 4 }));
  });

  test('query when topK is greater than number of records', async () => {
    const topK = 21; // in setup.ts, we seed the serverless index w/2 namespaces, each w/10 records
    const idForQuerying = recordIds[1];
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(10); // expect 10 records to be returned, since querying 1 namespace
      // Necessary to avoid could-be-undefined error for `usage` field:
      if (results.usage) {
        expect(results.usage.readUnits).toBeDefined();
      }
    };

    assertions(
      await serverlessNamespace.query({ id: idForQuerying, topK: topK })
    );
  });

  test('with invalid id, returns empty results', async () => {
    const topK = 2;
    const assertions = (results: QueryResponse) => {
      expect(results.matches).toBeDefined();
      expect(results.matches?.length).toEqual(0);
    };

    assertions(await serverlessNamespace.query({ id: '12354523423', topK }));
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
      await serverlessNamespace.query({
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
      await serverlessNamespace.query({
        vector: queryVec,
        sparseVector: sparseVec,
        topK: 2,
        includeValues: true,
        includeMetadata: true,
      })
    );
  });
});
