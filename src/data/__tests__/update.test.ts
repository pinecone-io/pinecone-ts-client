import { UpdateCommand } from '../update';
import { DataPlaneApi } from '../../pinecone-generated-ts-fetch';
import { DataOperationsProvider } from '../dataOperationsProvider';
import type { UpdateOperationRequest } from '../../pinecone-generated-ts-fetch';

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
});
