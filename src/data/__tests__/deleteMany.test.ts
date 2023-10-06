import { deleteMany } from '../deleteMany';
import { setupDeleteSuccess } from './deleteOne.test';

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
});
