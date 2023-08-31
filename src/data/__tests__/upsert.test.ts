import { upsert } from '../upsert';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type { UpsertOperationRequest } from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = { upsert: fakeUpsert } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;

  return { fakeUpsert, VOA, VoaProvider };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('upsert', () => {
  test('calls the openapi upsert endpoint', async () => {
    const { fakeUpsert, VoaProvider } = setupSuccess('');

    const upsertFn = upsert(VoaProvider, 'namespace');
    const returned = await upsertFn([{ id: '1', values: [1, 2, 3] }]);

    expect(returned).toBe(void 0);
    expect(fakeUpsert).toHaveBeenCalledWith({
      upsertRequest: {
        namespace: 'namespace',
        vectors: [{ id: '1', values: [1, 2, 3] }],
      },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const upsertFn = upsert(VoaProvider, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { VoaProvider } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        const upsertFn = upsert(VoaProvider, 'namespace');
        await upsertFn([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
