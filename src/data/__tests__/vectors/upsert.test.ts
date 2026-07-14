import { UpsertCommand } from '../../vectors/upsert';
import { VectorOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';
import type { UpsertVectorsRequest } from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../../pinecone-generated-ts-fetch/db_data/api_version';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertVectorsRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const VOA = { upsertVectors: fakeUpsert } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  const cmd = new UpsertCommand(VectorProvider, 'namespace');

  return { fakeUpsert, VOA, VectorProvider, cmd };
};

const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('upsert', () => {
  test('calls the openapi upsert endpoint', async () => {
    const { fakeUpsert, cmd } = setupSuccess('');

    const returned = await cmd.run({
      records: [{ id: '1', values: [1, 2, 3] }],
    });

    expect(returned).toBe(void 0);
    expect(fakeUpsert).toHaveBeenCalledWith({
      upsertRequest: {
        namespace: 'namespace',
        vectors: [{ id: '1', values: [1, 2, 3] }],
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('throw error if records array is empty', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run({ records: [] });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 record to upsert.',
    );
  });

  test('throw error if id is empty', async () => {
    const { cmd } = setupSuccess('');

    // Missing `id` property
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run({ records: [{ values: [1, 2, 3] }] });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Every record must include an `id` property in order to upsert.',
    );
  });

  test('throw error if values and sparseValues are empty', () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run({ records: [{ id: '1' }] });
    };
    expect(toThrow()).rejects.toThrowError(
      'Every record must include either `values` or `sparseValues` in order to upsert.',
    );
  });

  test('uses namespace from options when provided', async () => {
    const { fakeUpsert, cmd } = setupSuccess('');
    await cmd.run({
      records: [{ id: '1', values: [1, 2, 3] }],
      namespace: 'custom-namespace',
    });

    expect(fakeUpsert).toHaveBeenCalledWith({
      upsertRequest: {
        namespace: 'custom-namespace',
        vectors: [{ id: '1', values: [1, 2, 3] }],
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });
});
