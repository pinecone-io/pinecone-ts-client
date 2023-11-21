import { createCollection } from '../createCollection';
import { PineconeArgumentError } from '../../errors';
import { ManagePodIndexesApi } from '../../pinecone-generated-ts-fetch';
import type {
  CollectionModel,
  CreateCollectionOperationRequest,
  IndexList,
} from '../../pinecone-generated-ts-fetch';

const setOpenAPIResponse = (fakeCreateCollectionResponse) => {
  const fakeCreateCollection: (
    req: CreateCollectionOperationRequest
  ) => Promise<CollectionModel> = jest
    .fn()
    .mockImplementation(fakeCreateCollectionResponse);
  const fakeListIndexes: () => Promise<IndexList> = jest
    .fn()
    // TODO: Update mock responses to match actual response objects
    .mockImplementation(() =>
      Promise.resolve({
        indexes: [
          {
            name: 'index-1',
            dimension: 1,
            metric: 'cosine',
            host: '123-345-abcd.io',
            spec: {
              pod: {
                environment: 'us-west1',
                replicas: 1,
                shards: 1,
                podType: 'p1.x1',
                pods: 1,
              },
            },
            status: { ready: true, state: 'Ready' },
          },
          {
            name: 'index-2',
            dimension: 3,
            metric: 'cosine',
            host: '321-543-bcda.io',
            spec: {
              pod: {
                environment: 'us-west1',
                replicas: 1,
                shards: 1,
                podType: 'p1.x1',
                pods: 1,
              },
            },
            status: { ready: true, state: 'Ready' },
          },
        ],
      })
    );
  const IOA = {
    createCollection: fakeCreateCollection,
    listIndexes: fakeListIndexes,
  } as ManagePodIndexesApi;

  return IOA;
};

describe('createCollection', () => {
  describe('argument validations', () => {
    test('throws if no arguments are provided', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)();
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createCollection had type errors: argument must be object.'
      );
    });

    test('throws if argument is not an object', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)('not an object');
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createCollection had type errors: argument must be object.'
      );
    });

    test('throws if empty object', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)({});
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createCollection must have required properties: name, source.'
      );
    });

    test('throws if name is not provided', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        await createCollection(IOA)({
          name: '',
          source: 'index-name',
        });
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createCollection had validation errors: property 'name' must not be blank."
      );
    });

    test('throws if name is not a string', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)({ name: 1, source: 'index-name' });
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createCollection had type errors: property 'name' must be string."
      );
    });

    test('throws if source is not provided', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)({ name: 'collection-name' });
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        'The argument to createCollection must have required property: source.'
      );
    });

    test('throws if source is not a string', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        // @ts-ignore
        await createCollection(IOA)({ name: 'foo', source: 12 });
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createCollection had type errors: property 'source' must be string."
      );
    });

    test('throws if source is blank', async () => {
      const IOA = setOpenAPIResponse(() => Promise.resolve(''));
      const toThrow = async () => {
        await createCollection(IOA)({
          name: 'collection-name',
          source: '',
        });
      };

      expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      expect(toThrow).rejects.toThrowError(
        "The argument to createCollection had validation errors: property 'source' must not be blank."
      );
    });
  });

  test('calls the openapi create collection endpoint', async () => {
    const IOA = setOpenAPIResponse(() => Promise.resolve(''));
    const returned = await createCollection(IOA)({
      name: 'collection-name',
      source: 'index-name',
    });

    expect(returned).toBe(void 0);
    expect(IOA.createCollection).toHaveBeenCalledWith({
      createCollectionRequest: {
        name: 'collection-name',
        source: 'index-name',
      },
    });
  });
});
