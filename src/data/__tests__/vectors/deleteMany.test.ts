import { deleteMany } from '../../vectors/deleteMany';
import { setupDeleteSuccess } from './deleteOne.test';
import { PineconeArgumentError } from '../../../errors';

describe('deleteMany', () => {
  test('calls the openapi delete endpoint, passing ids with target namespace', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const returned = await deleteManyFn({ ids: ['123', '456', '789'] });

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456', '789'], namespace: 'namespace' },
      xPineconeApiVersion: '2025-10',
    });
  });

  test('calls the openapi delete endpoint, passing filter with target namespace', async () => {
    const { VOA, VectorProvider } = setupDeleteSuccess(undefined);

    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const returned = await deleteManyFn({ filter: { genre: 'ambient' } });

    expect(returned).toBe(void 0);
    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { filter: { genre: 'ambient' }, namespace: 'namespace' },
      xPineconeApiVersion: '2025-10',
    });
  });

  test('throws if pass in empty filter obj', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({ filter: { some: '' } });
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      '`filter` property cannot be empty',
    );
  });

  test('throws if pass no record IDs', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({ ids: [] });
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 record ID.',
    );
  });

  test('throws if both ids and filter are provided', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({ ids: ['123'], filter: { genre: 'ambient' } });
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      'Cannot provide both `ids` and `filter`',
    );
  });

  test('throws if neither ids nor filter are provided', async () => {
    const { VectorProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({});
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      'Either `ids` or `filter` must be provided',
    );
  });

  test('uses namespace from options when provided with ids', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    await deleteManyFn({ ids: ['123', '456'], namespace: 'custom-namespace' });

    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: { ids: ['123', '456'], namespace: 'custom-namespace' },
      xPineconeApiVersion: '2025-10',
    });
  });

  test('uses namespace from options when provided with filter', async () => {
    const { VectorProvider, VOA } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(VectorProvider, 'namespace');
    await deleteManyFn({
      filter: { genre: 'ambient' },
      namespace: 'custom-namespace',
    });

    expect(VOA.deleteVectors).toHaveBeenCalledWith({
      deleteRequest: {
        filter: { genre: 'ambient' },
        namespace: 'custom-namespace',
      },
      xPineconeApiVersion: '2025-10',
    });
  });
});
