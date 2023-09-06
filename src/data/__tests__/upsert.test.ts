import { UpsertCommand } from '../upsert';
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
  const cmd = new UpsertCommand(VoaProvider, 'namespace');

  return { fakeUpsert, VOA, VoaProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('upsert', () => {
  const generateTestRecords = (numberOfVectors: number) =>
    Array.from({ length: numberOfVectors }, (_, i) => ({
      id: `test-create-${i}`,
      values: [1, 2, 3],
    }));

  test('calls the openapi upsert endpoint', async () => {
    const { fakeUpsert, cmd } = setupSuccess('');

    const returned = await cmd.run([{ id: '1', values: [1, 2, 3] }]);

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
      const records = generateTestRecords(10);
      const batches = sliceArrayToBatches(records, 0);

      expect(records).toBe(batches[0]);
    });

    describe('array length less than batchSize', () => {
      test('array length 0', () => {
        expect(sliceArrayToBatches([], 10)).toEqual([]);
      });

      test('array length odd', () => {
        const records = generateTestRecords(1);
        const batches = sliceArrayToBatches(records, 10);

        expect(records).toEqual(batches[0]);
      });

      test('array length even', () => {
        const records = generateTestRecords(2);
        const batches = sliceArrayToBatches(records, 6);

        expect(batches.length).toBe(1);
        expect(batches[0]).toEqual(records);
      });
    });

    describe('array length greater than batchSize', () => {
      test('batchSize divides cleanly into array length', () => {
        const records = generateTestRecords(20);
        const batches = sliceArrayToBatches(records, 10);

        expect(batches.length).toBe(2);
        expect(batches[0]).toEqual(records.slice(0, 10));
        expect(batches[1]).toEqual(records.slice(10));
      });

      test('batchSize does not divide cleanly into array length', () => {
        const records = generateTestRecords(27);
        const batches = sliceArrayToBatches(records, 5);

        expect(batches.length).toBe(6);
        expect(batches[0]).toEqual(records.slice(0, 5));
        expect(batches[1]).toEqual(records.slice(5, 10));
        expect(batches[2]).toEqual(records.slice(10, 15));
        expect(batches[3]).toEqual(records.slice(15, 20));
        expect(batches[4]).toEqual(records.slice(20, 25));
        expect(batches[5]).toEqual(records.slice(25));
      });
    });

    test('array length equal to batch size', () => {
      const records = generateTestRecords(10);
      const batches = sliceArrayToBatches(records, 10);

      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual(records);
    });
  });

  describe('batched upsert', () => {
    test('passing an object with vectors and batchSize calls the openapi upsert endpoint with appropriate batches', async () => {
      const { fakeUpsert, VoaProvider } = setupSuccess('');

      const records = generateTestRecords(50);
      const batchSize = 10;
      const batches = sliceArrayToBatches(records, batchSize);

      const returned = await upsert(
        VoaProvider,
        'namespace'
      )({ records, batchSize });

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
      const { cmd } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        await cmd.run([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { cmd } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        await cmd.run([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
