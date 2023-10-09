import { UpdateCommand } from '../update';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type { UpdateOperationRequest } from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const VOA = { update: fakeUpdate } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  const cmd = new UpdateCommand(VoaProvider, 'namespace');
  return { fakeUpdate, VOA, VoaProvider, cmd };
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
