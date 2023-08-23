import { deleteIndex } from '../deleteIndex';
import {
  PineconeArgumentError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';

describe('deleteIndex', () => {
  describe('argument validation', () => {
    test('should throw if index name is not provided', async () => {
      const IOA = {
        deleteIndex: jest.fn().mockImplementation(() => Promise.resolve('')),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const IOA = {
        deleteIndex: jest.fn().mockImplementation(() => Promise.resolve('')),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const IOA = {
        deleteIndex: jest.fn().mockImplementation(() => Promise.resolve('')),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

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
      const IOA = {
        deleteIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 500 } })
          ),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
    });
  });

  describe('custom error mapping', () => {
    test('not found (404), fetches and shows available index names', async () => {
      const IOA = {
        deleteIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 404 } })
          ),
        listIndexes: jest
          .fn()
          .mockImplementation(() => Promise.resolve(['foo', 'bar'])),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist. Valid index names: ['foo', 'bar']`
      );
    });

    test('not found (404), fetches and shows available index names (empty list)', async () => {
      const IOA = {
        deleteIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 404 } })
          ),
        listIndexes: jest.fn().mockImplementation(() => Promise.resolve([])),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist. Valid index names: []`
      );
    });

    test('not found (404), error while fetching index list', async () => {
      const IOA = {
        deleteIndex: jest
          .fn()
          .mockImplementation(() =>
            Promise.reject({ response: { status: 404 } })
          ),
        listIndexes: jest
          .fn()
          .mockImplementation(() => Promise.reject('error')),
      };
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        IndexOperationsApi: IOA,
      }));

      // @ts-ignore
      const expectToThrow = async () => await deleteIndex(IOA)('index-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Index 'index-name' does not exist.`
      );
    });
  });
});
