import { deleteOne } from '../../vectors/deleteOne';
import type {
  DeleteOperationRequest,
  VectorOperationsApi as DataPlaneApi,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { DataOperationsProvider } from '../../vectors/dataOperationsProvider';
import { PineconeArgumentError } from '../../../errors';

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

describe('deleteOne', () => {
  test('Calls the openapi delete endpoint, passing target namespace and the vector id to delete', async () => {
    const { DataProvider, DPA } = setupDeleteSuccess(undefined);

    const deleteOneFn = deleteOne(DataProvider, 'namespace');
    const returned = await deleteOneFn('123');

    expect(returned).toBe(void 0);
    expect(DPA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123'], namespace: 'namespace' },
    });
  });

  test('Throw error if pass empty string as ID', async () => {
    const { DataProvider } = setupDeleteSuccess(undefined);
    const deleteOneFn = deleteOne(DataProvider, 'namespace');
    const toThrow = async () => {
      await deleteOneFn('');
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'You must pass a non-empty string for `options` in order to delete a record.'
    );
  });
});
