import { deleteOne } from '../deleteOne';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import type {
  DeleteOperationRequest,
  VectorOperationsApi,
} from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';

const setupDeleteResponse = (response, isSuccess) => {
  const fakeDelete: (req: DeleteOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
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

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider } = setupDeleteFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const deleteOneFn = deleteOne(VoaProvider, 'namespace');
        await deleteOneFn('123');
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const { VoaProvider } = setupDeleteFailure({
        status: 400,
        text: () => serverError,
      });

      const toThrow = async () => {
        const deleteOneFn = deleteOne(VoaProvider, 'namespace');
        await deleteOneFn('123');
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
