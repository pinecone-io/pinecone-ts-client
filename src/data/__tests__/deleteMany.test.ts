import { deleteMany } from '../deleteMany';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('deleteMany', () => {
  test('calls the openapi delete endpoint, passing ids with target namespace', async () => {
    const fakeDelete: (req: DeleteOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { _delete: fakeDelete } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const deleteManyFn = deleteMany(VOA, 'namespace');
    const returned = await deleteManyFn(['123', '456', '789']);

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456', '789'], namespace: 'namespace' },
    });
  });

  test('calls the openapi delete endpoint, passing filter with target namespace', async () => {
    const fakeDelete: (req: DeleteOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { _delete: fakeDelete } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const deleteManyFn = deleteMany(VOA, 'namespace');
    const returned = await deleteManyFn({ genre: 'ambient' });

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { filter: { genre: 'ambient' }, namespace: 'namespace' },
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
        const deleteManyFn = deleteMany(VOA, 'namespace');
        await deleteManyFn({ ids: ['123', '456', '789'] });
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
        const deleteManyFn = deleteMany(VOA, 'namespace');
        await deleteManyFn({ ids: ['123', '456', '789'] });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
