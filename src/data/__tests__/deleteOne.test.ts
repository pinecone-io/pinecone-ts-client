import { deleteOne } from '../deleteOne';
import type {
  DeleteOperationRequest,
  DataPlaneApi,
} from '../../pinecone-generated-ts-fetch/data';
import { DataOperationsProvider } from '../dataOperationsProvider';

const setupDeleteResponse = (response, isSuccess) => {
  const fakeDelete: (req: DeleteOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = { _delete: fakeDelete } as DataPlaneApi;
  const DataProvider = { provide: async () => DPA } as DataOperationsProvider;
  return { DPA, DataProvider };
};
export const setupDeleteSuccess = (response) => {
  return setupDeleteResponse(response, true);
};
export const setupDeleteFailure = (response) => {
  return setupDeleteResponse(response, false);
};

describe('deleteOne', () => {
  test('calls the openapi delete endpoint, passing target namespace and the vector id to delete', async () => {
    const { DataProvider, DPA } = setupDeleteSuccess(undefined);

    const deleteOneFn = deleteOne(DataProvider, 'namespace');
    const returned = await deleteOneFn('123');

    expect(returned).toBe(void 0);
    expect(DPA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123'], namespace: 'namespace' },
    });
  });
});
