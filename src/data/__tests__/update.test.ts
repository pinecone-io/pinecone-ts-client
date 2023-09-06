import { UpdateCommand } from '../update';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type { UpdateOperationRequest } from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeUpdate: (req: UpdateOperationRequest) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = { update: fakeUpdate } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  const cmd = new UpdateCommand(VoaProvider, 'namespace');
  return { fakeUpdate, VOA, VoaProvider, cmd };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('update', () => {
  test('calls the openapi update endpoint, passing target namespace', async () => {
    const { fakeUpdate, cmd } = setupSuccess('');

    const returned = await cmd.run({
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
        setMetadata: { genre: 'ambient' },
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
        await cmd.run({ id: 'fake-vector', values: [0.1, 0.2, 0.3] });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const { cmd } = setupFailure({
        status: 400,
        text: () => 'backend error message',
      });

      const toThrow = async () => {
        await cmd.run({ id: 'fake-vector', values: [0.1, 0.2, 0.3] });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow('backend error message');
    });
  });
});
