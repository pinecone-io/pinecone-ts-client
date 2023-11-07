import { createCollection } from '../createCollection';
import { PineconeArgumentError } from '../../errors';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  CreateCollectionOperationRequest as CCOR,
  ListIndexes200Response,
} from '../../pinecone-generated-ts-fetch';

const setOpenAPIResponse = (fakeCreateCollectionResponse) => {
  const fakeCreateCollection: (req: CCOR) => Promise<string> = jest
    .fn()
    .mockImplementation(fakeCreateCollectionResponse);
  const fakeListIndexes: () => Promise<ListIndexes200Response> = jest
    .fn()
    .mockImplementation(() => Promise.resolve(['foo', 'bar']));
  const IOA = {
    createCollection: fakeCreateCollection,
    listIndexes: fakeListIndexes,
  } as IndexOperationsApi;

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
