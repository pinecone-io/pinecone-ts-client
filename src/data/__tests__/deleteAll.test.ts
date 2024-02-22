import { deleteAll } from '../deleteAll';
import { setupDeleteSuccess } from './deleteOne.test';

describe('deleteAll', () => {
  test('calls the openapi delete endpoint, passing deleteAll with target namespace', async () => {
    const { VoaProvider, DPA } = setupDeleteSuccess(undefined);

    const deleteAllFn = deleteAll(VoaProvider, 'namespace');
    const returned = await deleteAllFn();

    expect(returned).toBe(void 0);
    expect(DPA._delete).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'namespace' },
    });
  });
});
