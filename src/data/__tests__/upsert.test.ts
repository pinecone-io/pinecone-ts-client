import { UpsertCommand } from '../upsert';
import { VectorOperationsApi as DataPlaneApi } from '../../pinecone-generated-ts-fetch/db_data';
import type { UpsertOperationRequest } from '../../pinecone-generated-ts-fetch/db_data';
import { DataOperationsProvider } from '../dataOperationsProvider';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { upsert: fakeUpsert } as DataPlaneApi;
  const DataProvider = { provide: async () => DPA } as DataOperationsProvider;
  const cmd = new UpsertCommand(DataProvider, 'namespace');

  return { fakeUpsert, DPA, DataProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('upsert', () => {
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

  test('throw error if known property is misspelled', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run([{ id: '1', valuess: [1, 2, 3] }]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Object contained invalid properties: valuess. Valid properties include id, values, sparseValues, metadata.'
    );
  });

  test('throw error if records array is empty', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run([]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 record to upsert.'
    );
  });

  test('throw error if any item in records array is incomplete', async () => {
    const { cmd } = setupSuccess('');

    // Missing `values` property
    let toThrow = async () => {
      // @ts-ignore
      await cmd.run([{ id: 'abc' }]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Every record must include a `values` property in order to upsert.'
    );

    // Missing `id` property
    toThrow = async () => {
      // @ts-ignore
      await cmd.run([{ values: [1, 2, 3] }]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Every record must include an `id` property in order to upsert.'
    );
  });
});
