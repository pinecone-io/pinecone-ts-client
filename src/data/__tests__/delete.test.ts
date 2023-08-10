import { deleteVector } from '../delete';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('deleteVector', () => {
  test('calls the openapi delete endpoint, passing target namespace', async () => {
    const mockDelete: (req: DeleteOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { _delete: mockDelete } as VectorOperationsApi;
    const namespace = 'test-namespace';
    const ids = ['123', '456', '789'];
    const deleteAll = false;
    const filter = {};

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const deleteFn = deleteVector(VOA, namespace);
    const returned = await deleteFn({ ids, deleteAll, filter });

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: {
        ids,
        namespace,
        deleteAll,
        filter,
      },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const mockDelete: (req: DeleteOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: {
              status: 500,
              text: () => 'backend error message',
            },
          })
        );

      const VOA = { _delete: mockDelete } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const deleteVectorFn = deleteVector(VOA, 'namespace');
        await deleteVectorFn({ ids: ['1', '2', '3', '4'] });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const mockDelete: (req: DeleteOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({ response: { status: 400, text: () => serverError } })
        );

      const VOA = { _delete: mockDelete } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const deleteVectorFn = deleteVector(VOA, 'namespace');
        await deleteVectorFn({ ids: ['1', '2', '3', '4'] });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
