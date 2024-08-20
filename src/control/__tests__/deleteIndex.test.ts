import { deleteIndex } from '../deleteIndex';
import { PineconeArgumentError } from '../../errors';

describe('deleteIndex', () => {
  const setupSuccessResponse = (responseData) => {
    return {
      deleteIndex: jest
        .fn()
        .mockImplementation(() => Promise.resolve(responseData)),
    };
  };

  describe('argument validation', () => {
    test('should throw if index name is not provided', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)();

      await expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(expectToThrow).rejects.toThrowError(
        'You must pass a non-empty string for `indexName` in order to delete an index'
      );
    });

    test('should throw if index name is empty string', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('');

      await expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(expectToThrow).rejects.toThrowError(
        'You must pass a non-empty string for `indexName` in order to delete an index'
      );
    });
  });
});
