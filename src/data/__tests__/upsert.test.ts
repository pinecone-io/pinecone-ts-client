import { upsert } from '../upsert';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type { UpsertOperationRequest } from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = { upsert: fakeUpsert } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;

  return { fakeUpsert, VOA, VoaProvider };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('upsert', () => {
  const generateTestVectors = (numberOfVectors: number) =>
    Array.from({ length: numberOfVectors }, (_, i) => ({
      id: `test-create-${i}`,
      values: [1, 2, 3],
    }));

  test('calls the openapi upsert endpoint', async () => {
    const { fakeUpsert, VoaProvider } = setupSuccess('');

    const upsertFn = upsert(VoaProvider, 'namespace');
    const returned = await upsertFn([{ id: '1', values: [1, 2, 3] }]);

    expect(returned).toBe(void 0);
    expect(fakeUpsert).toHaveBeenCalledWith({
      upsertRequest: {
        namespace: 'namespace',
        vectors: [{ id: '1', values: [1, 2, 3] }],
      },
    });
  });

  describe('chunked upsert', () => {
    test('passing an object with vectors and chunkSize calls the openapi upsert endpoint with appropriate chunks', async () => {
      const fakeUpsert: (
        req: UpsertOperationRequest
      ) => Promise<UpsertResponse> = jest.fn();
      const VOA = { upsert: fakeUpsert } as VectorOperationsApi;

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const vectors = generateTestVectors(50);
      const chunkSize = 10;
      const chunks = Array.from(
        { length: Math.ceil(vectors.length / chunkSize) },
        (_, i) => vectors.slice(i * chunkSize, (i + 1) * chunkSize)
      );

      const returned = await upsert(VOA, 'namespace')({ vectors, chunkSize });

      expect(returned).toBe(void 0);
      expect(fakeUpsert).toHaveBeenCalledTimes(5);
      for (let i = 0; i < chunks.length; i++) {
        expect(fakeUpsert).toHaveBeenNthCalledWith(i + 1, {
          upsertRequest: { namespace: 'namespace', vectors: chunks[i] },
        });
      }
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const upsertFn = upsert(VoaProvider, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { VoaProvider } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const upsertFn = upsert(VoaProvider, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
