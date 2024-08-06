import { deleteCollection } from '../deleteCollection';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';
import type {
  DeleteCollectionRequest,
  CollectionList,
} from '../../pinecone-generated-ts-fetch/control';

const setupMocks = (
  deleteResponse,
  listCollectionResponse = () => Promise.resolve([]),
) => {
  const fakeDeleteCollection: (req: DeleteCollectionRequest) => Promise<void> =
    jest.fn().mockImplementation(deleteResponse);
  const fakeListCollections: () => Promise<CollectionList> = jest
    .fn()
    .mockImplementation(listCollectionResponse);
  const IOA = {
    deleteCollection: fakeDeleteCollection,
    listCollections: fakeListCollections,
  };
  return IOA as ManageIndexesApi;
};

describe('deleteCollection', () => {
  describe('argument validation', () => {
    test('should throw if collection name is not provided', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)();

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had type errors: argument must be string.',
      );
    });

    test('should throw if collection name is not a string', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)({});

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had type errors: argument must be string.',
      );
    });

    test('should throw if collection name is empty string', async () => {
      const IOA = setupMocks(() => Promise.resolve(''));
      // @ts-ignore
      const expectToThrow = async () => await deleteCollection(IOA)('');

      expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
      expect(expectToThrow).rejects.toThrowError(
        'The argument to deleteCollection had validation errors: argument must not be blank.',
      );
    });
  });
});
