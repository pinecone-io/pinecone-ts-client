import { deleteCollection } from '../deleteCollection';
import {
  PineconeArgumentError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DeleteCollectionRequest as DCR } from '../../pinecone-generated-ts-fetch';

const setupMocks = (
  deleteResponse,
  listCollectionResponse = () => Promise.resolve([''])
) => {
  const fakeDeleteCollection: (req: DCR) => Promise<string> = jest
    .fn()
    .mockImplementation(deleteResponse);
  const fakeListCollections: () => Promise<string[]> = jest
    .fn()
    .mockImplementation(listCollectionResponse);
  const IOA = {
    deleteCollection: fakeDeleteCollection,
    listCollections: fakeListCollections,
  };
  return IOA as IndexOperationsApi;
};

describe('deleteCollection', () => {
  describe('argument validation', () => {
    test('should throw if collection name is not provided', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had type errors: argument must be string.'
      );
    });

    test('should throw if collection name is not a string', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had type errors: argument must be string.'
      );
    });

    test('should throw if collection name is empty string', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had validation errors: argument must not be blank.'
      );
    });
  });

  describe('uses http error mapper', () => {
    test('it should map errors with the http error mapper (500)', async () => {
      const IOA = setupMocks(() =>
        Promise.reject({ response: { status: 500, text: async () => '' } })
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await deleteCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
    });
  });

  describe('custom error mapping', () => {
    test('not found (404), fetches and shows available collection names', async () => {
      const IOA = setupMocks(
        () =>
          Promise.reject({ response: { status: 404, text: async () => '' } }),
        () => Promise.resolve(['foo', 'bar'])
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await deleteCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist. Valid collection names: ['foo', 'bar']`
      );
    });

    test('not found (404), fetches and shows available collection names (empty list)', async () => {
      const IOA = setupMocks(
        () =>
          Promise.reject({ response: { status: 404, text: async () => '' } }),
        () => Promise.resolve([])
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await deleteCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist. Valid collection names: []`
      );
    });

    test('not found (404), error while fetching collection list', async () => {
      const IOA = setupMocks(
        () =>
          Promise.reject({ response: { status: 404, text: async () => '' } }),
        () => Promise.reject('error')
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await deleteCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist.`
      );
    });
  });
});
