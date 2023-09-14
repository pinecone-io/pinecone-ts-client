import { UpsertCommand } from '../upsert';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { UpsertOperationRequest } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';

const setupResponse = (response, isSuccess) => {
  const fakeUpsert: (req: UpsertOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = { upsert: fakeUpsert } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  const cmd = new UpsertCommand(VoaProvider, 'namespace');

  return { fakeUpsert, VOA, VoaProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('upsert', () => {
  test('calls the openapi upsert endpoint', async () => {
    const { fakeUpsert, cmd } = setupSuccess('');

    const returned = await cmd.run([{ id: '1', values: [1, 2, 3] }]);

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
      const { cmd } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        await cmd.run([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { cmd } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        await cmd.run([]);
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
