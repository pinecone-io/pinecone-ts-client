import { update } from '../update';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { UpdateOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('update', () => {
  test('calls the openapi update endpoint, passing target namespace', async () => {
    const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> =
      jest.fn();
    const VOA = { update: fakeUpdate } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const updateFn = update(VOA, 'namespace');
    const returned = await updateFn({
      id: 'fake-vector',
      values: [1, 2, 3, 4, 5],
      sparseValues: {
        indices: [15, 30, 25],
        values: [0.5, 0.5, 0.2],
      },
      metadata: { genre: 'ambient' },
    });

    expect(returned).toBe(void 0);
    expect(fakeUpdate).toHaveBeenCalledWith({
      updateRequest: {
        namespace: 'namespace',
        id: 'fake-vector',
        values: [1, 2, 3, 4, 5],
        sparseValues: {
          indices: [15, 30, 25],
          values: [0.5, 0.5, 0.2],
        },
        metadata: { genre: 'ambient' },
      },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: {
              status: 500,
              text: () => 'backend error message',
            },
          })
        );
      const VOA = { update: fakeUpdate } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const updateFn = update(VOA, 'namespace');
        await updateFn({ id: 'fake-vector' });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({
            response: {
              status: 400,
              text: () => 'backend error message',
            },
          })
        );
      const VOA = { update: fakeUpdate } as VectorOperationsApi;

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const updateFn = update(VOA, 'namespace');
        await updateFn({ id: 'fake-vector' });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
