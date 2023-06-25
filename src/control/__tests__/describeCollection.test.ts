import { describeCollection } from '../describeCollection';
import {
  PineconeArgumentError,
  PineconeInternalServerError,
  PineconeNotFoundError,
} from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  DescribeCollectionRequest as DCR,
  CollectionMeta,
} from '../../pinecone-generated-ts-fetch';

const setupMocks = (
  describeResponse,
  listCollectionResponse: () => Promise<Array<string>>
) => {
  const fakeDescribeCollection: (req: DCR) => Promise<CollectionMeta> = jest
    .fn()
    .mockImplementation(describeResponse);
  const fakeListCollections: () => Promise<Array<string>> = jest
    .fn()
    .mockImplementation(listCollectionResponse);
  const IOA = {
    describeCollection: fakeDescribeCollection,
    listCollections: fakeListCollections,
  };
  jest.mock('../../pinecone-generated-ts-fetch', () => ({
    IndexOperationsApi: IOA,
  }));
  return IOA as IndexOperationsApi;
};

describe('describeCollection', () => {
  describe('argument validation', () => {
    test('should throw if collection name is not provided', async () => {
      const IOA = setupMocks(
        () => Promise.resolve(''),
        () => Promise.resolve([])
      );
      // @ts-ignore
      const expectToThrow = async () => await describeCollection(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'Argument to describeCollection has a problem. The argument must be string.'
      );
    });

    test('should throw if collection name is not a string', async () => {
      const IOA = setupMocks(
        () => Promise.resolve(''),
        () => Promise.resolve([])
      );
      // @ts-ignore
      const expectToThrow = async () => await describeCollection(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'Argument to describeCollection has a problem. The argument must be string.'
      );
    });

    test('should throw if collection name is empty string', async () => {
      const IOA = setupMocks(
        () => Promise.resolve(''),
        () => Promise.resolve([])
      );
      // @ts-ignore
      const expectToThrow = async () => await describeCollection(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'Argument to describeCollection has a problem. The argument must not be blank.'
      );
    });
  });

  describe('happy path', () => {
    test('it should return the collection meta', async () => {
      const IOA = setupMocks(
        () =>
          Promise.resolve({
            name: 'collection-name',
            size: 3085509,
            status: 'Ready',
          }),
        () => Promise.resolve([])
      );

      // @ts-ignore
      const response = await describeCollection(IOA)('collection-name');

      expect(response).toEqual({
        name: 'collection-name',
        size: 3085509,
        status: 'Ready',
      });
    });
  });

  describe('uses http error mapper', () => {
    test('it should map errors with the http error mapper (500)', async () => {
      const IOA = setupMocks(
        () => Promise.reject({ response: { status: 500 } }),
        () => Promise.resolve([])
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await describeCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
    });
  });

  describe('custom error mapping', () => {
    test('not found (404), fetches and shows available collection names', async () => {
      const IOA = setupMocks(
        () => Promise.reject({ response: { status: 404 } }),
        () => Promise.resolve(['foo', 'bar'])
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await describeCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist. Valid collection names: ['foo', 'bar']`
      );
    });

    test('not found (404), fetches and shows available collection names (empty list)', async () => {
      const IOA = setupMocks(
        () => Promise.reject({ response: { status: 404 } }),
        () => Promise.resolve([])
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await describeCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist. Valid collection names: []`
      );
    });

    test('not found (404), error while fetching collection list', async () => {
      const IOA = setupMocks(
        () => Promise.reject({ response: { status: 404 } }),
        () => Promise.reject('error')
      );

      // @ts-ignore
      const expectToThrow = async () =>
        await describeCollection(IOA)('collection-name');

      expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
      expect(expectToThrow).rejects.toThrowError(
        `Collection 'collection-name' does not exist.`
      );
    });
  });
});
