import {
  FetchVectorsByMetadataRequest,
  FetchByMetadataResponse,
  VectorOperationsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import { FetchByMetadataCommand } from '../../vectors/fetchByMetadata';

const indexNamespace = 'namespace-1';
const setupResponse = (response, isSuccess) => {
  const fakeFetchByMetadata: (
    req: FetchVectorsByMetadataRequest,
  ) => Promise<FetchByMetadataResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const VOA = {
    fetchVectorsByMetadata: fakeFetchByMetadata,
  } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  const cmd = new FetchByMetadataCommand(VectorProvider, indexNamespace);
  return { fakeFetchByMetadata, VOA, VectorProvider, cmd };
};

describe('fetchByMetadata', () => {
  test('calls the openapi fetchByMetadata endpoint, passing target namespace, and properly maps the response', async () => {
    const { VOA, cmd } = setupResponse({ vectors: [] }, true);
    const filter = { genre: 'classical' };
    const limit = 100;
    const paginationToken = 'paginationToken';
    const returned = await cmd.run({
      filter,
      limit,
      paginationToken,
    });
    expect(returned).toEqual({ records: [], namespace: '' });
    expect(VOA.fetchVectorsByMetadata).toHaveBeenCalledWith({
      fetchByMetadataRequest: {
        limit: limit,
        filter: filter,
        paginationToken: paginationToken,
        namespace: indexNamespace,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('throws error if no filter is provided', async () => {
    const { cmd } = setupResponse({ vectors: [] }, true);
    const toThrow = async () => {
      // @ts-expect-error when filter is missing
      await cmd.run({});
    };
    await expect(toThrow()).rejects.toThrowError(
      'You must pass a non-empty object for the `filter` field in order to fetch by metadata.',
    );
  });
});
