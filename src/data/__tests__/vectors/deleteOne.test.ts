import { deleteOne } from '../../vectors/deleteOne';
import type {
  DeleteVectorsRequest,
  VectorOperationsApi,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import { PineconeArgumentError } from '../../../errors';

const setupDeleteResponse = (response, isSuccess) => {
  const fakeDelete: (req: DeleteVectorsRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const VOA = { deleteVectors: fakeDelete } as VectorOperationsApi;
  const VectorProvider = { provide: async () => VOA } as VectorOperationsProvider;
  return { VOA, VectorProvider };
};
export const setupDeleteSuccess = (response) => {
  return setupDeleteResponse(response, true);
};

describe('deleteOne', () => {
  test('Calls the openapi delete endpoint, passing target namespace and the vector id to delete', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteOneFn = deleteOne(VectorProvider, 'namespace');
    const returned = await deleteOneFn('123');

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123'], namespace: 'namespace' },
    });
  });

  test('Throw error if pass empty string as ID', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteOneFn = deleteOne(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteOneFn('');
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'You must pass a non-empty string for `options` in order to delete a record.'
    );
  });
});
