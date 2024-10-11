import { deleteMany } from '../../vectors/deleteMany';
import { setupDeleteSuccess } from './deleteOne.test';
import { PineconeArgumentError } from '../../../errors';

describe('deleteMany', () => {
  test('calls the openapi delete endpoint, passing ids with target namespace', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const returned = await deleteManyFn(['123', '456', '789']);

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456', '789'], namespace: 'namespace' },
    });
  });

  test('calls the openapi delete endpoint, passing filter with target namespace', async () => {
    const { VOA, VectorProvider } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const returned = await deleteManyFn({ genre: 'ambient' });

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { filter: { genre: 'ambient' }, namespace: 'namespace' },
    });
  });

  test('throws if pass in empty filter obj', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({ some: '' });
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      '`filter` property cannot be empty'
    );
  });

  test('throws if pass no record IDs', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn([]);
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 record ID.'
    );
  });
});
