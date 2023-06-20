import { configureIndex } from '../configureIndex';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';

describe('configureIndex', () => {
  beforeEach(() => {
    // @ts-ignore
    const IOA = { configureIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      IndexOperationsApi: IOA,
    }));
  });

  test('calls the openapi configure endpoint', async () => {
    const returned = await configureIndex(IOA)('index-name', { replicas: 10 });

    expect(returned).toBe(void 0);
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'index-name',
      patchRequest: { replicas: 10 },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const IOA = {
        configureIndex: jest.fn().mockImplementation(() =>
          Promise.reject({
            response: {
              status: 500,
              text: () => 'backend error message',
            },
          })
        ),
      };

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const toThrow = async () => {
        // @ts-ignore
        await configureIndex(IOA)('index-name', { replicas: 10 });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const IOA = {
        configureIndex: jest.fn().mockImplementation(() =>
          Promise.reject({
            response: {
              status: 400,
              text: () => 'backend error message',
            },
          })
        ),
      };

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const toThrow = async () => {
        // @ts-ignore
        await configureIndex(IOA)('index-name', { replicas: 10 });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });

    test('when 404 occurs, show available indexes', async () => {
      const IOA = {
        configureIndex: jest.fn().mockImplementation(() =>
          Promise.reject({
            response: {
              status: 404,
              text: () => 'backend error message',
            },
          })
        ),
        listIndexes: jest
          .fn()
          .mockImplementation(() => Promise.resolve(['foo', 'bar'])),
      };

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      const toThrow = async () => {
        // @ts-ignore
        await configureIndex(IOA)('index-name', { replicas: 10 });
      };

      await expect(toThrow).rejects.toThrow(PineconeNotFoundError);
      await expect(toThrow).rejects.toThrow(
        "Index 'index-name' does not exist. Valid index names: ['foo', 'bar']"
      );
    });
  });
});
