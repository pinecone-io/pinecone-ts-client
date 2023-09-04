import { sliceArrayToBatches, upsert } from '../upsert';
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

  describe('sliceArrayToBatches', () => {
    test('batchSize 0 returns original array as batch', () => {
      const vectors = generateTestVectors(10);
      const batches = sliceArrayToBatches(vectors, 0);

      expect(vectors).toBe(batches[0]);
    });

    describe('array length less than batchSize', () => {
      test('array length 0', () => {
        expect(sliceArrayToBatches([], 10)).toEqual([]);
      });

      test('array length odd', () => {
        const vectors = generateTestVectors(1);
        const batches = sliceArrayToBatches(vectors, 10);

        expect(vectors).toEqual(batches[0]);
      });

      test('array length even', () => {
        const vectors = generateTestVectors(2);
        const batches = sliceArrayToBatches(vectors, 6);

        expect(batches.length).toBe(1);
        expect(batches[0]).toEqual(vectors);
      });
    });

    describe('array length greater than batchSize', () => {
      test('batchSize divides cleanly into array length', () => {
        const vectors = generateTestVectors(20);
        const batches = sliceArrayToBatches(vectors, 10);

        expect(batches.length).toBe(2);
        expect(batches[0]).toEqual(vectors.slice(0, 10));
        expect(batches[1]).toEqual(vectors.slice(10));
      });

      test('batchSize does not divide cleanly into array length', () => {
        const vectors = generateTestVectors(27);
        const batches = sliceArrayToBatches(vectors, 5);

        expect(batches.length).toBe(6);
        expect(batches[0]).toEqual(vectors.slice(0, 5));
        expect(batches[1]).toEqual(vectors.slice(5, 10));
        expect(batches[2]).toEqual(vectors.slice(10, 15));
        expect(batches[3]).toEqual(vectors.slice(15, 20));
        expect(batches[4]).toEqual(vectors.slice(20, 25));
        expect(batches[5]).toEqual(vectors.slice(25));
      });
    });

    test('array length equal to batch size', () => {
      const vectors = generateTestVectors(10);
      const batches = sliceArrayToBatches(vectors, 10);

      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual(vectors);
    });
  });

  describe('batched upsert', () => {
    test('passing an object with vectors and batchSize calls the openapi upsert endpoint with appropriate batches', async () => {
      const { fakeUpsert, VoaProvider } = setupSuccess('');

      const vectors = generateTestVectors(50);
      const batchSize = 10;
      const batches = sliceArrayToBatches(vectors, batchSize);

      const returned = await upsert(
        VoaProvider,
        'namespace'
      )({ vectors, batchSize });

      expect(returned).toBe(void 0);
      expect(fakeUpsert).toHaveBeenCalledTimes(5);
      for (let i = 0; i < batches.length; i++) {
        expect(fakeUpsert).toHaveBeenNthCalledWith(i + 1, {
          upsertRequest: { namespace: 'namespace', vectors: batches[i] },
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
