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
        'Argument to configureIndex has a problem. The argument must be string.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)(1, { replicas: 10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'Argument to configureIndex has a problem. The argument must be string.'
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('', { replicas: 2 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'Argument to configureIndex has a problem. The argument must not be blank.'
      );
    });

    test('should throw if a patch config is not provided', async () => {
      const toThrow = async () => await configureIndex(IOA)('index-name', {});

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "At least one mutable property must be specified from list ['replicas', 'podType']. Replicas must be a non-negative integer, podType must be a known pod type. See the API reference documentation at https://docs.pinecone.io/reference/configure_index"
      );
    });

    test('should throw if replicas is not a number', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { replicas: '10' });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "At least one mutable property must be specified from list ['replicas', 'podType']. Replicas must be a non-negative integer, podType must be a known pod type. See the API reference documentation at https://docs.pinecone.io/reference/configure_index"
      );
    });

    test('should throw if podType is not a string', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { podType: 10.5 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "At least one mutable property must be specified from list ['replicas', 'podType']. Replicas must be a non-negative integer, podType must be a known pod type. See the API reference documentation at https://docs.pinecone.io/reference/configure_index"
      );
    });

    test('should throw if replicas is not a positive integer', async () => {
      const toThrow = async () =>
        await configureIndex(IOA)('index-name', { replicas: 0 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "At least one mutable property must be specified from list ['replicas', 'podType']. Replicas must be a non-negative integer, podType must be a known pod type. See the API reference documentation at https://docs.pinecone.io/reference/configure_index"
      );
    });
  });
});
