import { fetch } from '../fetch';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  FetchRequest,
  FetchResponse,
} from '../../pinecone-generated-ts-fetch';

describe('fetch', () => {
  test('calls the openapi fetch endpoint, passing target namespace', async () => {
    const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({
          vectors: [],
        })
      );
    const VOA = { fetch: fakeFetch } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const fetchFn = fetch(VOA, 'namespace');
    const returned = await fetchFn(['1', '2']);

    expect(returned).toEqual({"vectors": []});
    expect(VOA.fetch).toHaveBeenCalledWith({
      ids: ['1', '2'],
      namespace: 'namespace',
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: {
              status: 500,
              text: () => 'backend error message',
            },
          })
        );
      const VOA = {
        fetch: fakeFetch,
      } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const fetchFn = fetch(VOA, 'namespace');
        await fetchFn(['1']);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: {
              status: 400,
              text: () => 'backend error message',
            },
          })
        );
      const VOA = {
        fetch: fakeFetch,
      } as VectorOperationsApi;

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const fetchFn = fetch(VOA, 'namespace');
        await fetchFn(['1']);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
