import { UpdateCommand } from '../../vectors/update';
import { VectorOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import type { UpdateVectorRequest } from '../../../pinecone-generated-ts-fetch/db_data';

const setupResponse = (response, isSuccess) => {
  const fakeUpdate: (req: UpdateVectorRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const VOA = { updateVector: fakeUpdate } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  const cmd = new UpdateCommand(VectorProvider, 'namespace');
  return { fakeUpdate, VOA, VectorProvider, cmd };
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
      xPineconeApiVersion: '2025-10',
    });
  });

  test('throws error if no id or filter are provided', async () => {
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
      'You must pass a non-empty string for the `id` field or a `filter` object in order to update records.'
    );
  });

  test('throws error if both id and filter are provided', async () => {
    const { cmd } = setupSuccess('');
    const toThrow = async () => {
      await cmd.run({
        id: 'abc',
        filter: { genre: 'ambient' },
      });
    };
    await expect(toThrow()).rejects.toThrowError(
      'You cannot pass both an `id` and a `filter` object to update records. Use either `id` to update a single record, or `filter` to update multiple records.'
    );
  });

  test('throws error if unknown property is passed', async () => {
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
      'Object contained invalid properties: unknown. Valid properties include id, values, sparseValues, metadata, filter.'
    );
  });
});
