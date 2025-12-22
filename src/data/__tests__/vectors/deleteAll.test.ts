import { deleteAll } from '../../vectors/deleteAll';
import { setupDeleteSuccess } from './deleteOne.test';

describe('deleteAll', () => {
  test('calls the openapi delete endpoint, passing deleteAll with target namespace', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteAllFn = deleteAll(VectorProvider, 'namespace');
    const returned = await deleteAllFn();

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'namespace' },
      xPineconeApiVersion: '2025-10',
    });
  });
});
