import { FetchCommand } from '../../vectors/fetch';
import { VectorOperationsApi as DataPlaneApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { DataOperationsProvider } from '../../vectors/dataOperationsProvider';
import type {
  FetchRequest,
  FetchResponse,
} from '../../../pinecone-generated-ts-fetch/db_data';

const setupResponse = (response, isSuccess) => {
  const fakeFetch: (req: FetchRequest) => Promise<FetchResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { fetch: fakeFetch } as DataPlaneApi;
  const DataProvider = { provide: async () => DPA } as DataOperationsProvider;
  const cmd = new FetchCommand(DataProvider, 'namespace');
  return { DPA, DataProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('fetch', () => {
  test('calls the openapi fetch endpoint, passing target namespace', async () => {
    const { DPA, cmd } = setupSuccess({ vectors: [] });
    const returned = await cmd.run(['1', '2']);

    expect(returned).toEqual({ records: [], namespace: '' });
    expect(DPA.fetch).toHaveBeenCalledWith({
      ids: ['1', '2'],
      namespace: 'namespace',
    });
  });

  test('Throws error if pass in empty array', async () => {
    const { cmd } = setupSuccess({ vectors: [] });
    const toThrow = async () => {
      await cmd.run([]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 recordID.'
    );
  });
});
