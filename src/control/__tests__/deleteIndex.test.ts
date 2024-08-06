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

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.',
      );
    });

    test('should throw if index name is not a string', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.',
      );
    });

    test('should throw if index name is empty string', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had validation errors: argument must not be blank.',
      );
    });
  });
});
