import { deleteMany } from '../deleteMany';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { setupDeleteSuccess, setupDeleteFailure } from './deleteOne.test';

describe('deleteMany', () => {
  test('calls the openapi delete endpoint, passing ids with target namespace', async () => {
    const { VoaProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VoaProvider, 'namespace');
    const returned = await deleteManyFn(['123', '456', '789']);

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456', '789'], namespace: 'namespace' },
    });
  });

  test('calls the openapi delete endpoint, passing filter with target namespace', async () => {
    const { VOA, VoaProvider } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VoaProvider, 'namespace');
    const returned = await deleteManyFn({ genre: 'ambient' });

    expect(returned).toBe(void 0);
    expect(VOA._delete).toHaveBeenCalledWith({
      deleteRequest: { filter: { genre: 'ambient' }, namespace: 'namespace' },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider, VOA } = setupDeleteFailure({ status: 500, text: () => 'backend error message' })

      const toThrow = async () => {
        const deleteManyFn = deleteMany(VoaProvider, 'namespace');
        await deleteManyFn({ ids: ['123', '456', '789'] });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const { VoaProvider } = setupDeleteFailure({ status: 400, text: () => serverError });

      const toThrow = async () => {
        const deleteManyFn = deleteMany(VoaProvider, 'namespace');
        await deleteManyFn({ ids: ['123', '456', '789'] });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
