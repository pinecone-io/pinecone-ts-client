import { deleteAll } from '../../vectors/deleteAll';
import { setupDeleteSuccess } from './deleteOne.test';
import { X_PINECONE_API_VERSION } from '../../../pinecone-generated-ts-fetch/db_data/api_version';

describe('deleteAll', () => {
  test('calls the openapi delete endpoint, passing deleteAll with target namespace', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteAllFn = deleteAll(VectorProvider, 'namespace');
    const returned = await deleteAllFn();

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'namespace' },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('uses namespace from options when provided', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteAllFn = deleteAll(VectorProvider, 'namespace');
    await deleteAllFn({ namespace: 'custom-namespace' });

    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { deleteAll: true, namespace: 'custom-namespace' },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });
});
