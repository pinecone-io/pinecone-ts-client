import { listIndexes } from '../listIndexes';

describe('listIndexes', () => {
  test('should return a list of index objects', async () => {
    const IndexOperationsApi = {
      listIndexes: jest.fn().mockImplementation(() =>
        Promise.resolve({
          databases: [
            {
              database: {
                name: 'index-name',
                dimension: 5,
                capacityMode: 'pod',
                metric: 'cosine',
              },
              status: {
                ready: true,
                state: 'Ready',
                host: '789-123-foo.svc.efgh.pinecone.io',
                port: 443,
              },
            },
            {
              database: {
                name: 'index-name-2',
                dimension: 5,
                capacityMode: 'pod',
                metric: 'cosine',
              },
              status: {
                ready: true,
                state: 'Ready',
                host: '123-456-foo.svc.abcd.pinecone.io',
                port: 443,
              },
            },
          ],
        })
      ),
    };

    // @ts-ignore
    const returned = await listIndexes(IndexOperationsApi)();

    expect(returned).toEqual([
      {
        database: {
          name: 'index-name',
          dimension: 5,
          capacityMode: 'pod',
          metric: 'cosine',
        },
        status: {
          ready: true,
          state: 'Ready',
          host: '789-123-foo.svc.efgh.pinecone.io',
          port: 443,
        },
      },
      {
        database: {
          name: 'index-name-2',
          dimension: 5,
          capacityMode: 'pod',
          metric: 'cosine',
        },
        status: {
          ready: true,
          state: 'Ready',
          host: '123-456-foo.svc.abcd.pinecone.io',
          port: 443,
        },
      },
    ]);
  });
});
