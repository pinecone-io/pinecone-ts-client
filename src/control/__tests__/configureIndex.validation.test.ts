// @ts-nocheck

// Disabling typescript in this file because the entire point is to catch
// cases where library callers (who may not be using typescript) pass
// incorrect argument values.

import { configureIndex } from '../configureIndex';
import { PineconeArgumentError } from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';

describe('configureIndex argument validations', () => {
  let IOA: IndexOperationsApi;
  beforeEach(() => {
    IOA = { configureIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      IndexOperationsApi: IOA,
    }));
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      const toThrow = async () => await configureIndex(IOA)();

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)(1, { replicas: 10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had type errors: argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('', { replicas: 2 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The first argument to configureIndex had validation errors: argument must not be blank.'
      );
    });

    test('should throw if a patch config is not provided', async () => {
      const toThrow = async () => await configureIndex(IOA)('index-name', {});

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The second argument to configureIndex should not be empty object. Please specify at least one propert (replicas, podType) to update.'
      );
    });

    test('should throw if replicas is not a number', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { replicas: '10' });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had type errors: property 'replicas' must be integer."
      );
    });

    test('should throw if podType is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { podType: 10.5 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had type errors: property 'podType' must be string."
      );
    });

    test('should throw if replicas is not a positive integer', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { replicas: 0 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The second argument to configureIndex had validation errors: property 'replicas' must be >= 1."
      );
    });
  });
});
