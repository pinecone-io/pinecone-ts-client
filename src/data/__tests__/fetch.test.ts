import { FetchCommand } from '../fetch';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type {
  FetchRequest,
  FetchResponse,
} from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const VOA = { fetch: fakeFetch } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  const cmd = new FetchCommand(VoaProvider, 'namespace');
  return { VOA, VoaProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('fetch', () => {
  test('calls the openapi fetch endpoint, passing target namespace', async () => {
    const { VOA, cmd } = setupSuccess({ vectors: [] });
    const returned = await cmd.run(['1', '2']);

    expect(returned).toEqual({ records: [], namespace: '' });
    expect(VOA.fetch).toHaveBeenCalledWith({
      ids: ['1', '2'],
      namespace: 'namespace',
    });
  });
});
