import { deleteMany } from '../deleteMany';
import { setupDeleteSuccess } from './deleteOne.test';

describe('deleteMany', () => {
  test('calls the openapi delete endpoint, passing ids with target namespace', async () => {
    const { DataProvider, DPA } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(DataProvider, 'namespace');
    const returned = await deleteManyFn(['123', '456', '789']);

    expect(returned).toBe(void 0);
    expect(DPA._delete).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456', '789'], namespace: 'namespace' },
    });
  });

  test('calls the openapi delete endpoint, passing filter with target namespace', async () => {
    const { DPA, DataProvider } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(DataProvider, 'namespace');
    const returned = await deleteManyFn({ genre: 'ambient' });

    expect(returned).toBe(void 0);
    expect(DPA._delete).toHaveBeenCalledWith({
      deleteRequest: { filter: { genre: 'ambient' }, namespace: 'namespace' },
    });
  });
});
