import { deleteOne } from '../deleteOne';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('deleteOne', () => {
  test('calls the openapi delete endpoint, passing target namespace and the vector id to delete', async () => {
    const fakeDelete: (req: DeleteOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { _delete: fakeDelete } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const deleteOneFn = deleteOne(VOA, 'namespace');
    const returned = await deleteOneFn('123');

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123'], namespace: 'namespace' },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeDelete: (req: DeleteOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: { status: 500, text: () => 'backend error message' },
          })
        );

      const VOA = { _delete: fakeDelete } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const deleteOneFn = deleteOne(VOA, 'namespace');
        await deleteOneFn('123');
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const fakeDelete: (req: DeleteOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({ response: { status: 400, text: () => serverError } })
        );

      const VOA = { _delete: fakeDelete } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const deleteOneFn = deleteOne(VOA, 'namespace');
        await deleteOneFn('123');
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
