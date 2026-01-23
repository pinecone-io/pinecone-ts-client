import {
  ListNamespacesOperationRequest,
  ListNamespacesResponse,
  NamespaceOperationsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../../namespaces/namespacesOperationsProvider';
import { listNamespaces } from '../../namespaces/listNamespaces';

const setupResponse = (response, isSuccess) => {
  const fakeListNamespaces: (
    req: ListNamespacesOperationRequest,
  ) => Promise<ListNamespacesResponse> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );

  const NOA = {
    listNamespacesOperation: fakeListNamespaces,
  } as NamespaceOperationsApi;

  const NamespaceOperationsProvider = {
    provide: async () => NOA,
  } as NamespaceOperationsProvider;

  const cmd = listNamespaces(NamespaceOperationsProvider);

  return { fakeListNamespaces, NOA, NamespaceOperationsProvider, cmd };
};

describe('listNamespaces', () => {
  test('should call listNamespacesOperation with correct request', async () => {
    const { cmd, fakeListNamespaces } = setupResponse({ namespaces: [] }, true);

    const limit = 1;
    const paginationToken = 'fake-pagination-token-123123123';
    const prefix = 'fake-prefix-123123123';

    await cmd(limit, paginationToken, prefix);

    expect(fakeListNamespaces).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit,
      paginationToken,
      prefix,
    });
  });
});
