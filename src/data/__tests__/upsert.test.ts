import { UpsertCommand } from '../upsert';
import { DataPlaneApi } from '../../pinecone-generated-ts-fetch';
import type { UpsertOperationRequest } from '../../pinecone-generated-ts-fetch';
import { DataOperationsProvider } from '../dataOperationsProvider';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { upsert: fakeUpsert } as DataPlaneApi;
  const VoaProvider = { provide: async () => DPA } as DataOperationsProvider;
  const cmd = new UpsertCommand(VoaProvider, 'namespace');

  return { fakeUpsert, DPA, VoaProvider, cmd };
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
});
