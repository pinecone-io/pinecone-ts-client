import { deleteAll } from '../deleteAll';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteOperationRequest } from '../../pinecone-generated-ts-fetch';
import { setupDeleteFailure, setupDeleteSuccess } from './deleteOne.test';

describe('deleteAll', () => {
  test('calls the openapi delete endpoint, passing deleteAll with target namespace', async () => {
    const { VoaProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteAllFn = deleteAll(VoaProvider, 'namespace');
    const returned = await deleteAllFn();

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'namespace' },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider, VOA } = setupDeleteFailure({ status: 500, text: () => 'backend error message' });

      const toThrow = async () => {
        const deleteAllFn = deleteAll(VoaProvider, 'namespace');
        await deleteAllFn();
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const { VoaProvider } = setupDeleteFailure({ status: 400, text: () => serverError });

      const toThrow = async () => {
        const deleteAllFn = deleteAll(VoaProvider, 'namespace');
        await deleteAllFn();
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
