// @ts-nocheck

// Disabling typescript in this file because the entire point is to catch
// cases where library callers (who may not be using typescript) pass
// incorrect argument values.

import { createIndex } from '../createIndex';
import { PineconeArgumentError } from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';

describe('createIndex argument validations', () => {
  let IOA: IndexOperationsApi;
  beforeEach(() => {
    IOA = { createIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      IndexOperationsApi: IOA,
    }));
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      const toThrow = async () => await createIndex(IOA)();

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'Argument to createIndex has a problem. The argument must be object.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: 12, dimension: 10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'name' must be string."
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: '', dimension: 10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'name' must not be blank."
      );
    });

    test('should throw if dimension is not provided', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: 'index-name' });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The argument must have required property 'dimension'."
      );
    });

    test('should throw if dimension is not a number', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: 'index-name', dimension: '10' });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is float', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: 'index-name', dimension: 10.5 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({ name: 'index-name', dimension: -10 });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'dimension' must be >= 1."
      );
    });
  });

  describe('optional configurations', () => {
    test('metric: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          metric: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'metric' must be string."
      );
    });

    test('metric: should throw if blank string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          metric: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'metric' must not be blank."
      );
    });

    test('replicas: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          replicas: '10',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'replicas' must be integer."
      );
    });

    test('replicas: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          replicas: -10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'replicas' must be >= 1."
      );
    });

    test('podType: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          podType: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'podType' must be string."
      );
    });

    test('podType: should throw if not a valid pod type', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          podType: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'podType' must not be blank."
      );
    });

    test('pods: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          pods: '10',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'pods' must be integer."
      );
    });

    test('pods: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          pods: -10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'pods' must be >= 1."
      );
    });

    test('metadataConfig: should throw if not an object', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          metadataConfig: '{}',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'metadataConfig' must be object."
      );
    });

    test('sourceCollection: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          sourceCollection: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'sourceCollection' must be string."
      );
    });

    test('sourceCollection: should throw if blank string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          sourceCollection: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "Argument to createIndex has a problem. The property 'sourceCollection' must not be blank."
      );
    });
  });
});
