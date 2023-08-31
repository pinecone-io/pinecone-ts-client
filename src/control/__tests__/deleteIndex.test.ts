import { deleteIndex } from '../deleteIndex';
import {
  PineconeArgumentError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';

describe('deleteIndex', () => {
  const setupSuccessResponse = (responseData) => {
    return {
      deleteIndex: jest
        .fn()
        .mockImplementation(() => Promise.resolve(responseData)),
    };
  };

  const setupErrorResponse = (response) => {
    return {
      deleteIndex: jest
        .fn()
        .mockImplementation(() => Promise.reject({ response })),
      listIndexes: jest
        .fn()
        .mockImplementation(() => Promise.resolve(['foo', 'bar'])),
    };
  };

  describe('argument validation', () => {
    test('should throw if index name is not provided', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const IOA = setupSuccessResponse('');

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had validation errors: argument must not be blank.'
      );
    });
  });

  describe('uses http error mapper', () => {
    test('it should map errors with the http error mapper (500)', async () => {
      const IOA = setupErrorResponse({ status: 500, text: async () => '' });

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
    });
  });

  describe('custom error mapping', () => {
    test('not found (404), fetches and shows available index names', async () => {
      const IOA = setupErrorResponse({ status: 404, text: async () => '' });

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist. Valid index names: ['foo', 'bar']`
      );
    });

    test('not found (404), error while fetching index list', async () => {
      const IOA = {
        deleteIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 404, text: async () => '' } })
          ),
        listIndexes: jest
          .fn()
          .mockImplementation(() => Promise.reject('error')),
      };

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist.`
      );
    });
  });
});
