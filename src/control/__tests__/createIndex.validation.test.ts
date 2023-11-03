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
        'The argument to createIndex had type errors: argument must be object.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 12,
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'name' must be string."
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: '',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'name' must not be blank."
      );
    });

    test('should throw if dimension is not provided', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: dimension.'
      );
    });

    test('should throw if dimension is not a number', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: '10',
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is float', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10.5,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: -10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'dimension' must be >= 1."
      );
    });

    test('should throw if region is not provided', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: region.'
      );
    });

    test('should throw if region is not a string', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 111,
          cloud: 'gcp',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'region' must be string."
      );
    });

    test('should throw if cloud is not provided', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: cloud.'
      );
    });

    test('should throw if cloud is not a string', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 123,
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'cloud' is a constant which must be equal to one of: 'gcp', 'aws', 'azure'."
      );
    });

    test('should throw if cloud is not one of the expected strings', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'pcg',
          capacityMode: 'pod',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'cloud' is a constant which must be equal to one of: 'gcp', 'aws', 'azure'."
      );
    });

    test('should throw if capacityMode is not provided', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: capacityMode.'
      );
    });

    test('should throw if capacityMode is not a string', () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 321,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'capacityMode' must be string."
      );
    });
  });

  describe('optional configurations', () => {
    test('metric: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          metric: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'metric' must be string."
      );
    });

    test('metric: should throw if blank string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          metric: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'metric' must not be blank."
      );
    });

    test('replicas: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          replicas: '10',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'replicas' must be integer."
      );
    });

    test('replicas: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          replicas: -10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'replicas' must be >= 1."
      );
    });

    test('podType: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          podType: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'podType' must be string."
      );
    });

    test('podType: should throw if not a valid pod type', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          podType: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'podType' must not be blank."
      );
    });

    test('pods: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          pods: '10',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'pods' must be integer."
      );
    });

    test('pods: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          pods: -10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'pods' must be >= 1."
      );
    });

    test('metadataConfig: should throw if not an object', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          metadataConfig: '{}',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'metadataConfig' must be object."
      );
    });

    test('sourceCollection: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          sourceCollection: 10,
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'sourceCollection' must be string."
      );
    });

    test('sourceCollection: should throw if blank string', async () => {
      const toThrow = async () =>
        await createIndex(IOA)({
          name: 'index-name',
          dimension: 10,
          region: 'us-east3',
          cloud: 'gcp',
          capacityMode: 'pod',
          sourceCollection: '',
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'sourceCollection' must not be blank."
      );
    });
  });
});
