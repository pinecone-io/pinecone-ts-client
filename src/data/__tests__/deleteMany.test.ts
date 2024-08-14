import { deleteMany } from '../deleteMany';
import { setupDeleteSuccess } from './deleteOne.test';
import { PineconeArgumentError } from '../../errors';

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

  test('throws if pass in empty filter obj', async () => {
    const { DataProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(DataProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn({ some: '' });
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError('Filter cannot be empty');
  });

  test('throws if pass no record IDs', async () => {
    const { DataProvider } = setupDeleteSuccess(undefined);
    const deleteManyFn = deleteMany(DataProvider, 'namespace');
    const toThrow = async () => {
      await deleteManyFn([]);
    };
    await expect(toThrow()).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow()).rejects.toThrowError(
      'Must pass in at least 1 recordID.'
    );
  });
});
