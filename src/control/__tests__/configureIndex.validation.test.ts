import { configureIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';

describe('configureIndex argument validations', () => {
  let MIA: jest.Mocked<ManageIndexesApi>;
  beforeEach(() => {
    MIA = new ManageIndexesApi() as jest.Mocked<ManageIndexesApi>;
    MIA.configureIndex = jest.fn();
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      // @ts-expect-error - invalid options
      const toThrow = async () => await configureIndex(MIA)({});

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for `name` to configureIndex.',
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)({ name: '', podReplicas: 2 });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass a non-empty string for `name` to configureIndex.',
      );
    });

    test('should throw if spec or deletionProtection are not provided', async () => {
      const toThrowSpec = async () =>
        await configureIndex(MIA)({ name: 'index-name' });

      await expect(toThrowSpec).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrowSpec).rejects.toThrowError(
        'You must pass at least one configuration option to configureIndex.',
      );
    });

    test('should throw if no configuration options are provided', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)({ name: 'index-name' });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass at least one configuration option to configureIndex.',
      );
    });
  });
});
