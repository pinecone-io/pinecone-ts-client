import { configureIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';

describe('configureIndex argument validations', () => {
  let MIA: jest.Mocked<ManageIndexesApi>;
  beforeEach(() => {
    MIA = new ManageIndexesApi() as jest.Mocked<ManageIndexesApi>;
    MIA.configureIndex = jest.fn();
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      // @ts-ignore
      const toThrow = async () => await configureIndex(MIA)();

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for `indexName` to configureIndex.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('', { spec: { pod: { replicas: 2 } } });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for `indexName` to configureIndex.'
      );
    });

    test('should throw if unknown property is passed at top level', async () => {
      const toThrow = async () =>
        // @ts-ignore
        await configureIndex(MIA)('', { speculoos: { pod: { replicas: 2 } } });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'Object contained invalid properties: speculoos. Valid properties include spec, deletionProtection.'
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

    test('should throw if unknown property is passed at spec/pod level', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', {
          // @ts-ignore
          spec: { pod: { replicasroonies: 2 } },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'Object contained invalid properties: replicasroonies. Valid properties include replicas, podType.'
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
        '`replicas` must be a positive integer.'
      );
    });
  });
});
