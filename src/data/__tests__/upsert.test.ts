import { upsert } from '../upsert';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  UpsertOperationRequest,
  UpsertResponse,
} from '../../pinecone-generated-ts-fetch';

describe('upsert', () => {
  test('calls the openapi upsert endpoint', async () => {
    const fakeUpsert: (req: UpsertOperationRequest) => Promise<UpsertResponse> =
      jest.fn();
    const VOA = { upsert: fakeUpsert } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const upsertFn = upsert(VOA, 'namespace');
    const returned = await upsertFn([{ id: '1', values: [1, 2, 3] }]);

    expect(returned).toBe(void 0);
    expect(VOA.upsert).toHaveBeenCalledWith({
      upsertRequest: {
        namespace: 'namespace',
        vectors: [{ id: '1', values: [1, 2, 3] }],
      },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeUpsert: (
        req: UpsertOperationRequest
      ) => Promise<UpsertResponse> = jest.fn().mockImplementation(() =>
        Promise.reject({
          response: {
            status: 500,
            text: () => 'backend error message',
          },
        })
      );
      const VOA = {
        upsert: fakeUpsert,
      } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const upsertFn = upsert(VOA, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const fakeUpsert: (
        req: UpsertOperationRequest
      ) => Promise<UpsertResponse> = jest.fn().mockImplementation(() =>
        Promise.reject({
          response: {
            status: 400,
            text: () => 'backend error message',
          },
        })
      );
      const VOA = {
        upsert: fakeUpsert,
      } as VectorOperationsApi;

      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const upsertFn = upsert(VOA, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
