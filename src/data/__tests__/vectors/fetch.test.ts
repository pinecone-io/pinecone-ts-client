import { FetchCommand } from '../../vectors/fetch';
import { VectorOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import type {
  FetchVectorsRequest,
  FetchResponse,
} from '../../../pinecone-generated-ts-fetch/db_data';

const setupResponse = (response, isSuccess) => {
  const fakeFetch: (req: FetchVectorsRequest) => Promise<FetchResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const VOA = { fetchVectors: fakeFetch } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  const cmd = new FetchCommand(VectorProvider, 'namespace');
  return { VOA, VectorProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('fetch', () => {
  test('calls the openapi fetch endpoint, passing target namespace, and properly maps the response', async () => {
    const { VOA, cmd } = setupSuccess({ vectors: [] });
    const returned = await cmd.run(['1', '2']);

    expect(returned).toEqual({ records: [], namespace: '' });
    expect(VOA.fetchVectors).toHaveBeenCalledWith({
      ids: ['1', '2'],
      namespace: 'namespace',
      xPineconeApiVersion: '2025-10',
    });
  });

  test('Throws error if pass in empty array', async () => {
    const { cmd } = setupSuccess({ vectors: [] });
    const toThrow = async () => {
      await cmd.run([]);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 recordID.',
    );
  });
});
