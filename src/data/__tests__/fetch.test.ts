import { fetch } from '../fetch';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type {
  FetchRequest,
  FetchResponse,
} from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = { fetch: fakeFetch } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  return { VOA, VoaProvider };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('fetch', () => {
  test('calls the openapi fetch endpoint, passing target namespace', async () => {
    const { VOA, VoaProvider } = setupSuccess({ vectors: [] });

    const fetchFn = fetch(VoaProvider, 'namespace');
    const returned = await fetchFn(['1', '2']);

    expect(returned).toEqual({ vectors: [] });
    expect(VOA.fetch).toHaveBeenCalledWith({
      ids: ['1', '2'],
      namespace: 'namespace',
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const fetchFn = fetch(VoaProvider, 'namespace');
        await fetchFn(['1']);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { VoaProvider } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const fetchFn = fetch(VoaProvider, 'namespace');
        await fetchFn(['1']);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
