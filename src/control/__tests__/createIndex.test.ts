import { createIndex } from '../createIndex';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  CreateIndexRequest,
  DescribeIndexRequest,
  IndexMeta,
} from '../../pinecone-generated-ts-fetch';

describe('createIndex', () => {
  test('calls the openapi create index endpoint, passing name and dimension', async () => {
    const fakeCreateIndex: (req: CreateIndexRequest) => Promise<string> =
      jest.fn();
    const IOA = { createIndex: fakeCreateIndex } as IndexOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', async () => ({
      IndexOperationsApi: IOA,
    }));

    const createIndexFn = createIndex(IOA);
    const returned = await createIndexFn({
      name: 'index-name',
      dimension: 10,
    });

    expect(returned).toBe(void 0);
    expect(IOA.createIndex).toHaveBeenCalledWith({
      createRequest: {
        name: 'index-name',
        dimension: 10,
      },
    });
  });

  describe('waitUntilReady', () => {
    test('when passed waitUntilReady, calls the create index endpoint and begins polling describeIndex', async () => {
      const fakeCreateIndex: (req: CreateIndexRequest) => Promise<string> =
        jest.fn();
      const fakeDescribeIndex: (
        req: DescribeIndexRequest
      ) => Promise<IndexMeta> = jest.fn().mockImplementation(() => ({
        status: { ready: true, state: 'Ready' },
      }));

      const IOA = {
        createIndex: fakeCreateIndex,
        describeIndex: fakeDescribeIndex,
      } as IndexOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const createIndexFn = createIndex(IOA);
      const returned = await createIndexFn({
        name: 'index-name',
        dimension: 10,
        waitUntilReady: true,
      });

      expect(returned).toBe('Index is ready after 0 seconds');
      expect(IOA.createIndex).toHaveBeenCalledWith({
        createRequest: {
          name: 'index-name',
          dimension: 10,
          waitUntilReady: true,
        },
      });
      expect(IOA.describeIndex).toHaveBeenCalledWith({
        indexName: 'index-name',
      });
    });

    test('will continue polling describeIndex if the index is not yet ready', async () => {
      jest.useFakeTimers();
      const fakeCreateIndex: (req: CreateIndexRequest) => Promise<string> =
        jest.fn();
      const fakeDescribeIndex: (
        req: DescribeIndexRequest
      ) => Promise<IndexMeta> = jest
        .fn()
        .mockResolvedValueOnce({
          status: { ready: false, state: 'Initializing' },
        })
        .mockResolvedValueOnce({
          status: { ready: false, state: 'ScalingUp' },
        })
        .mockResolvedValueOnce({
          status: { ready: false, state: 'ScalingUp' },
        })
        .mockResolvedValueOnce({
          status: { ready: true, state: 'Ready' },
        });

      const IOA = {
        createIndex: fakeCreateIndex,
        describeIndex: fakeDescribeIndex,
      } as IndexOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const returned = createIndex(IOA)({
        name: 'index-name',
        dimension: 10,
        waitUntilReady: true,
      });

      await jest.advanceTimersByTimeAsync(3000);

      return returned.then((result) => {
        expect(result).toBe('Index is ready after 3 seconds');
        expect(fakeDescribeIndex).toHaveBeenNthCalledWith(3, {
          indexName: 'index-name',
        });
        jest.useRealTimers();
      });
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeCreateIndex: (req: CreateIndexRequest) => Promise<string> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: { status: 500, text: () => 'backend error message' },
          })
        );

      const IOA = { createIndex: fakeCreateIndex } as IndexOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const toThrow = async () => {
        const createIndexFn = createIndex(IOA);
        await createIndexFn({ name: 'index-name', dimension: 10 });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const fakeCreateIndex: (req: CreateIndexRequest) => Promise<string> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: { status: 400, text: () => serverError },
          })
        );

      const IOA = { createIndex: fakeCreateIndex } as IndexOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const toThrow = async () => {
        const createIndexFn = createIndex(IOA);
        await createIndexFn({ name: 'index-name', dimension: 10 });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
