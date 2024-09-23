import { UpdateCommand } from '../vectors/update';
import { VectorOperationsApi as DataPlaneApi } from '../../pinecone-generated-ts-fetch/db_data';
import { DataOperationsProvider } from '../vectors/dataOperationsProvider';
import type { UpdateOperationRequest } from '../../pinecone-generated-ts-fetch/db_data';

const setupResponse = (response, isSuccess) => {
  const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { update: fakeUpdate } as DataPlaneApi;
  const DataProvider = { provide: async () => DPA } as DataOperationsProvider;
  const cmd = new UpdateCommand(DataProvider, 'namespace');
  return { fakeUpdate, DPA, DataProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('update', () => {
  test('calls the openapi update endpoint, passing target namespace', async () => {
    const { fakeUpdate, cmd } = setupSuccess('');

    const returned = await cmd.run({
      id: 'fake-vector',
      values: [1, 2, 3, 4, 5],
      sparseValues: {
        indices: [15, 30, 25],
        values: [0.5, 0.5, 0.2],
      },
      metadata: { genre: 'ambient' },
    });

    expect(returned).toBe(void 0);
    expect(fakeUpdate).toHaveBeenCalledWith({
      updateRequest: {
        namespace: 'namespace',
        id: 'fake-vector',
        values: [1, 2, 3, 4, 5],
        sparseValues: {
          indices: [15, 30, 25],
          values: [0.5, 0.5, 0.2],
        },
        setMetadata: { genre: 'ambient' },
      },
    });
  });

  test('throws error if no id is provided', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      // @ts-ignore
      await cmd.run({
        values: [1, 2, 3, 4, 5],
        sparseValues: { indices: [15, 30, 25], values: [0.5, 0.5, 0.2] },
        metadata: { genre: 'ambient' },
      });
    };
    await expect(toThrow()).rejects.toThrowError(
      'You must enter a non-empty string for the `id` field in order to update a record.'
    );
  });

  test('throws error if no unknown property is passed', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      await cmd.run({
        id: 'abc',
        values: [1, 2, 3, 4, 5],
        sparseValues: { indices: [15, 30, 25], values: [0.5, 0.5, 0.2] },
        metadata: { genre: 'ambient' },
        // @ts-ignore
        unknown: 'property',
      });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Object contained invalid properties: unknown. Valid properties include id, values, sparseValues, metadata.'
    );
  });

  test('throws error if no known property is misspelled', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      await cmd.run({
        id: 'abc',
        values: [1, 2, 3, 4, 5],
        sparseValues: { indices: [15, 30, 25], values: [0.5, 0.5, 0.2] },
        // @ts-ignore
        metadataaaa: { genre: 'ambient' },
      });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Object contained invalid properties: metadataaaa. Valid properties include id, values, sparseValues, metadata.'
    );
  });
});
