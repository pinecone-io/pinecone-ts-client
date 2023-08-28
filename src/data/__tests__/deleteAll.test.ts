import { deleteAll } from '../deleteAll';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('deleteAll', () => {
  test('calls the openapi delete endpoint, passing deleteAll with target namespace', async () => {
    const fakeDelete: (req: DeleteOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { _delete: fakeDelete } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const deleteAllFn = deleteAll(VOA, 'namespace');
    const returned = await deleteAllFn();

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'namespace' },
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
        const deleteAllFn = deleteAll(VOA, 'namespace');
        await deleteAllFn();
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
        const deleteAllFn = deleteAll(VOA, 'namespace');
        await deleteAllFn();
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
