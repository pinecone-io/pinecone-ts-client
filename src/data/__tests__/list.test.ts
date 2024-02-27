import { list, listPaginated } from '../list';
import type {
  ListRequest,
  ListResponse,
  DataPlaneApi,
} from '../../pinecone-generated-ts-fetch';
import { DataOperationsProvider } from '../dataOperationsProvider';

const setupListResponse = (response, isSuccess = true) => {
  const fakeList: (req: ListRequest) => Promise<ListResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { list: fakeList } as DataPlaneApi;
  const VoaProvider = { provide: async () => DPA } as DataOperationsProvider;
  return { DPA, VoaProvider };
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
    const { VoaProvider, DPA } = setupListResponse(listResponse);

    const listPaginatedFn = listPaginated(VoaProvider, 'list-namespace');
    const returned = await listPaginatedFn({ prefix: 'prefix-' });

    expect(returned).toBe(listResponse);
    expect(DPA.list).toHaveBeenCalledWith({
      prefix: 'prefix-',
      namespace: 'list-namespace',
    });
  });

  test('list calls the openapi list endpoint on iteration, passing target namespace with ListOptions', async () => {
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
    const { VoaProvider, DPA } = setupListResponse(listResponse);

    const listFn = list(VoaProvider, 'list-namespace');
    const asyncGenerator = listFn({ prefix: 'prefix-' });

    // Iterate once
    const { value } = await asyncGenerator.next();
    expect(value).toEqual(['prefix-1', 'prefix-2', 'prefix-3']);
    expect(DPA.list).toHaveBeenCalledWith({
      prefix: 'prefix-',
      namespace: 'list-namespace',
    });

    // Iterate again, make sure we pass the pagination token
    await asyncGenerator.next();
    expect(DPA.list).toHaveBeenCalledWith({
      prefix: 'prefix-',
      namespace: 'list-namespace',
      paginationToken: 'fake-pagination-token-123123123',
    });
  });
});
