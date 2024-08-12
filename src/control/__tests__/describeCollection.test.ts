import { describeCollection } from '../describeCollection';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';
import type {
  DescribeCollectionRequest,
  CollectionList,
  CollectionModel,
} from '../../pinecone-generated-ts-fetch/control';

const setupMocks = (
  describeResponse,
  listCollectionResponse: () => Promise<Array<string>>
) => {
  const fakeDescribeCollection: (
    req: DescribeCollectionRequest
  ) => Promise<CollectionModel> = jest
    .fn()
    .mockImplementation(describeResponse);
  const fakeListCollections: () => Promise<CollectionList> = jest
    .fn()
    .mockImplementation(listCollectionResponse);
  const IOA = {
    describeCollection: fakeDescribeCollection,
    listCollections: fakeListCollections,
  };
  return IOA as ManageIndexesApi;
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

      await expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(expectToThrow).rejects.toThrowError(
        'You must pass a non-empty string for `name` in order to describe a collection'
      );
    });

    test('should throw if collection name is empty string', async () => {
      const IOA = setupMocks(
        () => Promise.resolve(''),
        () => Promise.resolve([])
      );
      // @ts-ignore
      const expectToThrow = async () => await describeCollection(IOA)('');

      await expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(expectToThrow).rejects.toThrowError(
        'You must pass a non-empty string for `name` in order to describe a collection'
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
            recordCount: 120,
          }),
        () => Promise.resolve([])
      );

      // @ts-ignore
      const response = await describeCollection(IOA)('collection-name');

      expect(response).toEqual({
        name: 'collection-name',
        size: 3085509,
        status: 'Ready',
        recordCount: 120,
      });
    });
  });
});
