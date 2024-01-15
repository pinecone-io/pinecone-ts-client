// @ts-nocheck

// Disabling typescript in this file because the entire point is to catch
// cases where library callers (who may not be using typescript) pass
// incorrect argument values.

import { configureIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch';

describe('configureIndex argument validations', () => {
  let MIA: ManageIndexesApi;
  beforeEach(() => {
    MIA = { configureIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      IndexOperationsApi: MIA,
    }));
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      const toThrow = async () => await configureIndex(MIA)();

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)(1, { replicas: 10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('', { replicas: 2 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had validation errors: argument must not be blank.'
      );
    });

    test('should throw if spec and pod are not provided', async () => {
      const toThrowSpec = async () =>
        await configureIndex(MIA)('index-name', {});

      expect(toThrowSpec).rejects.toThrowError(PineconeArgumentError);
      expect(toThrowSpec).rejects.toThrowError(
        'The second argument to configureIndex should not be empty object. Please specify at least one property (replicas, podType) to update.'
      );
    });

    test('should throw if replicas is not a number', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', { replicas: '10' });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had type errors: property 'replicas' must be integer."
      );
    });

    test('should throw if podType is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', { podType: 10.5 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had type errors: property 'podType' must be string."
      );
    });

    test('should throw if replicas is not a positive integer', async () => {
      const toThrow = async () =>
        await configureIndex(MIA)('index-name', { replicas: 0 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had validation errors: property 'replicas' must be >= 1."
      );
    });
  });
});
