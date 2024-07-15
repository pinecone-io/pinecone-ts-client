// @ts-nocheck

// Disabling typescript in this file because the entire point is to catch
// cases where library callers (who may not be using typescript) pass
// incorrect argument values.

import { createIndex } from '../createIndex';
import { PineconeArgumentError } from '../../errors';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';

describe('createIndex argument validations', () => {
  let MIA: ManageIndexesApi;
  beforeEach(() => {
    MIA = { createIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch/control', () => ({
      ManageIndexesApi: MIA,
    }));
  });

  describe('required configurations', () => {
    test('should throw if index name is not provided', async () => {
      const toThrow = async () => await createIndex(MIA)();

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex had type errors: argument must be object.'
      );
    });

    test('should throw if index name is not a string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 12,
          dimension: 10,
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'name' must be string."
      );
    });

    test('should throw if index name is empty string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: '',
          dimension: 10,
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'name' must not be blank."
      );
    });

    test('should throw if dimension is not provided', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: dimension.'
      );
    });

    test('should throw if dimension is not a number', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: '10',
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is float', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10.5,
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'dimension' must be integer."
      );
    });

    test('should throw if dimension is not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: -10,
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'dimension' must be >= 1."
      );
    });

    test('should throw if region is not provided', () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: region.'
      );
    });

    test('should throw if region is not a string', () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 111,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/serverless/properties/region' must be string."
      );
    });

    test('should throw if cloud is not provided', () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            serverless: {
              region: 111,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createIndex must have required property: cloud.'
      );
    });

    test('should throw if cloud is not a string', () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            serverless: {
              region: 'us-east-1',
              cloud: 123,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/serverless/cloud' must be equal to one of: 'gcp', 'aws', 'azure'."
      );
    });

    test('should throw if cloud is not one of the expected strings', () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            serverless: {
              region: 'us-east-1',
              cloud: 'goo',
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/serverless/cloud' must be equal to one of: 'gcp', 'aws', 'azure'."
      );
    });
  });

  describe('optional configurations', () => {
    test('metric: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 10,
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'metric' must be equal to one of: 'cosine', 'euclidean', 'dotproduct'."
      );
    });

    test('metric: should throw if not one of the predefined literals', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'foo',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'metric' must be equal to one of: 'cosine', 'euclidean', 'dotproduct'."
      );
    });

    test('replicas: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: '10',
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/pod/properties/replicas' must be integer."
      );
    });

    test('replicas: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: -10,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'spec/properties/pod/properties/replicas' must be >= 1."
      );
    });

    test('podType: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 10,
              pods: 1,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/pod/properties/podType' must be string."
      );
    });

    test('podType: should throw if not a valid pod type', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: '',
              pods: 1,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'spec/properties/pod/properties/podType' must not be blank."
      );
    });

    test('pods: should throw if not an integer', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: '1',
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/pod/properties/pods' must be integer."
      );
    });

    test('pods: should throw if not a positive integer', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: -10,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'spec/properties/pod/properties/pods' must be >= 1."
      );
    });

    test('metadataConfig: should throw if not an object', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
              metadataConfig: 'metadata',
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/pod/properties/metadataConfig' must be object."
      );
    });

    test('sourceCollection: should throw if not a string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
              sourceCollection: 10,
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had type errors: property 'spec/properties/pod/properties/sourceCollection' must be string."
      );
    });

    test('sourceCollection: should throw if blank string', async () => {
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              replicas: 1,
              environment: 'us-east-1',
              shards: 1,
              podType: 'p1.x1',
              pods: 1,
              sourceCollection: '',
            },
          },
        });

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createIndex had validation errors: property 'spec/properties/pod/properties/sourceCollection' must not be blank."
      );
    });
  });
});
