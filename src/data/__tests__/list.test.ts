import { listPaginated } from '../vectors/list';
import type {
  ListRequest,
  ListResponse,
  VectorOperationsApi as DataPlaneApi,
} from '../../pinecone-generated-ts-fetch/db_data';
import { DataOperationsProvider } from '../vectors/dataOperationsProvider';

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

  test('Throw error if pass in empty prefix', async () => {
    const { VoaProvider } = setupListResponse({});
    const listPaginatedFn = listPaginated(VoaProvider, 'list-namespace');
    const toThrow = async () => {
      await listPaginatedFn({ limit: -3 });
    };
    await expect(toThrow()).rejects.toThrowError(
      '`limit` property must be greater than 0'
    );
  });

  test('Throw error if misspell property', async () => {
    const { VoaProvider } = setupListResponse({});
    const listPaginatedFn = listPaginated(VoaProvider, 'list-namespace');
    const toThrow = async () => {
      // @ts-ignore
      await listPaginatedFn({ limitgadsf: -3 });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Object contained invalid properties: limitgadsf. Valid properties include prefix, limit, paginationToken.'
    );
  });

  test('Throw error if add unknown property', async () => {
    const { VoaProvider } = setupListResponse({});
    const listPaginatedFn = listPaginated(VoaProvider, 'list-namespace');
    const toThrow = async () => {
      // @ts-ignore
      await listPaginatedFn({ limit: 3, testy: 'test' });
    };
    await expect(toThrow()).rejects.toThrowError(
      'Object contained invalid properties: testy. Valid properties include prefix, limit, paginationToken.'
    );
  });
});
