import { deleteOne } from '../deleteOne';
import type {
  DeleteOperationRequest,
  VectorOperationsApi,
} from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';

const setupDeleteResponse = (response, isSuccess) => {
  const fakeDelete: (req: DeleteOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const VOA = { _delete: fakeDelete } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  return { VOA, VoaProvider };
};
export const setupDeleteSuccess = (response) => {
  return setupDeleteResponse(response, true);
};
export const setupDeleteFailure = (response) => {
  return setupDeleteResponse(response, false);
};

describe('deleteOne', () => {
  test('calls the openapi delete endpoint, passing target namespace and the vector id to delete', async () => {
    const { VoaProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteOneFn = deleteOne(VoaProvider, 'namespace');
    const returned = await deleteOneFn('123');

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123'], namespace: 'namespace' },
    });
  });
});
