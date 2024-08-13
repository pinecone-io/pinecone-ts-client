import { configureIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';

describe('configureIndex argument validations', () => {
  let MIA: ManageIndexesApi;
  beforeEach(() => {
    // @ts-ignore
    MIA = { configureIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch/control', () => ({
      IndexOperationsApi: MIA,
    }));
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      // @ts-ignore
      const toThrow = async () => await configureIndex(MIA)();

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for indexName to configureIndex.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('', { spec: { pod: { replicas: 2 } } });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for indexName to configureIndex.'
      );
    });

    test('should throw if spec or deletionProtection are not provided', async () => {
      const toThrowSpec = async () =>
        await configureIndex(MIA)('index-name', {});

      await expect(toThrowSpec).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrowSpec).rejects.toThrowError(
        'You must pass either a `spec`, `deletionProtection` or both to configureIndex in order to update.'
      );
    });

    test('should throw if replicas is not a number', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', {
          // @ts-ignore
          spec: { pod: { replicas: '10' } },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had a type error: property 'spec/properties/pod/properties/replicas'" +
          ' must be an integer.'
      );
    });

    test('should throw if podType is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', {
          // @ts-ignore
          spec: { pod: { podType: 10.5 } },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'The second argument to configureIndex had validation errors: property' +
          " 'spec/properties/pod/properties/podType' must" +
          ' be string.'
      );
    });

    test('should throw if replicas is not an integer', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', {
          // @ts-ignore
          spec: { pod: { replicas: 'not a number' } },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'The second argument to configureIndex had a type error: property' +
          " 'spec/properties/pod/properties/replicas' must be an integer."
      );
    });

    test('should throw if replicas is not greater than 0', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', {
          // @ts-ignore
          spec: { pod: { replicas: -1 } },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'The second argument to configureIndex had validation errors: property' +
          " 'spec/properties/pod/properties/replicas' must be a positive integer."
      );
    });
  });
});
