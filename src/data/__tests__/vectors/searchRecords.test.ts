import { SearchRecordsCommand } from '../../vectors/searchRecords';
import { PineconeArgumentError } from '../../../errors';
import {
  VectorOperationsApi,
  SearchRecordsNamespaceRequest,
  SearchRecordsResponse,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';

const mockNamespace = 'mock-namespace';

const setupResponse = (response, isSuccess) => {
  const fakeSearchRecords: (
    req: SearchRecordsNamespaceRequest,
  ) => Promise<SearchRecordsResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const VOA = {
    searchRecordsNamespace: fakeSearchRecords,
  } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  const cmd = new SearchRecordsCommand(VectorProvider, mockNamespace);

  return { fakeSearchRecords, VOA, VectorProvider, cmd };
};

describe('SearchRecordsCommand', () => {
  test('calls the openapi search records endpoint', async () => {
    const { fakeSearchRecords, cmd } = setupResponse('', true);
    const mockSearchRequest = {
      query: {
        topK: 2,
        filter: { test: 'test' },
        inputs: { chunk: 'input' },
        vector: { sparseValues: [0.2, 0.5, 0.6], sparseIndicies: [1, 2, 3] },
        id: 'test-id',
        matchTerms: { strategy: 'all', terms: ['term1', 'term2', 'term3'] },
      },
      fields: ['chunk', 'test'],
      rerank: {
        model: 'test-model',
        rankFields: ['rank-test'],
        topN: 5,
        parameters: { test_param: 'test_param' },
        query: 'test query',
      },
    };

    const returned = await cmd.run(mockSearchRequest);

    expect(returned).toBe('');
    expect(fakeSearchRecords).toHaveBeenCalledWith({
      namespace: mockNamespace,
      searchRecordsRequest: mockSearchRequest,
      xPineconeApiVersion: '2025-10',
    });
  });

  test('missing query object throws error', async () => {
    const { cmd } = setupResponse('', true);

    try {
      // @ts-ignore
      await cmd.run({});
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toBe(
        'You must pass a `query` object to search.',
      );
    }
  });
});
