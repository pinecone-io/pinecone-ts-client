import { listPaginated } from '../../vectors/list';
import type {
  ListVectorsRequest,
  ListResponse,
  VectorOperationsApi,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';

const setupListResponse = (response, isSuccess = true) => {
  const fakeList: (req: ListVectorsRequest) => Promise<ListResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );
  const VOA = { listVectors: fakeList } as VectorOperationsApi;
  const VectorProvider = {
    provide: async () => VOA,
  } as VectorOperationsProvider;
  return { VOA: VOA, VectorProvider: VectorProvider };
};

describe('list', () => {
  test('listPaginated calls the openapi list endpoint, passing target namespace with ListOptions', async () => {
    const listResponse = {
      vectors: [
        { id: 'prefix-1', values: [0.2, 0.4] },
        { id: 'prefix-2', values: [0.3, 0.5] },
        { id: 'prefix-3', values: [0.4, 0.6] },
      ],
      pagination: { next: 'fake-pagination-token-123123123' },
      namespace: 'list-namespace',
      usage: { readUnits: 1 },
    };
    const { VectorProvider, VOA } = setupListResponse(listResponse);

    const listPaginatedFn = listPaginated(VectorProvider, 'list-namespace');
    const returned = await listPaginatedFn({ prefix: 'prefix-' });

    expect(returned).toBe(listResponse);
    expect(VOA.listVectors).toHaveBeenCalledWith({
      prefix: 'prefix-',
      namespace: 'list-namespace',
      xPineconeApiVersion: '2025-10',
    });
  });

  test('Throw error if pass in empty prefix', async () => {
    const { VectorProvider } = setupListResponse({});
    const listPaginatedFn = listPaginated(VectorProvider, 'list-namespace');
    const toThrow = async () => {
      await listPaginatedFn({ limit: -3 });
    };
    await expect(toThrow()).rejects.toThrow(
      '`limit` property must be greater than 0',
    );
  });

  test('uses namespace from options when provided', async () => {
    const listResponse = {
      vectors: [{ id: 'prefix-1', values: [0.2, 0.4] }],
      namespace: 'custom-namespace',
      usage: { readUnits: 1 },
    };
    const { VectorProvider, VOA } = setupListResponse(listResponse);

    const listPaginatedFn = listPaginated(VectorProvider, 'list-namespace');
    await listPaginatedFn({ prefix: 'prefix-', namespace: 'custom-namespace' });

    expect(VOA.listVectors).toHaveBeenCalledWith({
      prefix: 'prefix-',
      namespace: 'custom-namespace',
      xPineconeApiVersion: '2025-10',
    });
  });
});
