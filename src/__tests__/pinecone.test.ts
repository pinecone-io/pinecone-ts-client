import { Pinecone } from '../pinecone';
import type { PineconeConfiguration } from '../data';
import * as utils from '../utils';

const fakeFetch = jest.fn();

jest.mock('../utils', () => {
  const realUtils = jest.requireActual('../utils');

  return {
    ...realUtils,
    getFetch: () => fakeFetch,
  };
});
jest.mock('../data/fetch');
jest.mock('../data/upsert');

describe('Pinecone', () => {
  describe('constructor', () => {
    describe('required properties', () => {
      test('should throw an error if apiKey is not provided', () => {
        expect(() => {
          new Pinecone({} as PineconeConfiguration);
        }).toThrow(
          'The client configuration must have required property: apiKey.'
        );
      });

      test('should throw an error if apiKey is blank', () => {
        expect(() => {
          const config = {
            apiKey: '',
          } as PineconeConfiguration;
          new Pinecone(config);
        }).toThrow(
          "The client configuration had validation errors: property 'apiKey' must not be blank."
        );
      });
    });

    describe('unknown properties', () => {
      test('should throw an error if unknown property provided', () => {
        expect(() => {
          new Pinecone({
            apiKey: 'test-key',
            unknownProp: 'banana',
          } as PineconeConfiguration);
        }).toThrow(
          'The client configuration had validation errors: argument must NOT have additional properties.'
        );
      });
    });

    describe('optional properties', () => {
      test('should not throw when optional properties provided: fetchAPI, hostUrl', () => {
        expect(() => {
          new Pinecone({
            apiKey: 'test-key',
            fetchApi: utils.getFetch({} as PineconeConfiguration),
            hostUrl: 'https://foo-bar.io',
          } as PineconeConfiguration);
        }).not.toThrow();
      });
    });

    describe('configuration with environment variables', () => {
      beforeEach(() => {
        delete process.env.PINECONE_API_KEY;
      });

      test('should read required properties from environment variables if no config object provided', () => {
        process.env.PINECONE_API_KEY = 'test-api';

        const client = new Pinecone();

        expect(client).toBeDefined();
        expect(client.getConfig().apiKey).toEqual('test-api');
      });

      test('config object should take precedence when both config object and environment variables are provided', () => {
        process.env.PINECONE_API_KEY = 'test';
        const client = new Pinecone({
          apiKey: 'test2',
        });
        expect(client).toBeDefined();
        expect(client.getConfig().apiKey).toEqual('test2');
      });

      test('should throw an error if required environment variable is not set', () => {
        delete process.env.PINECONE_API_KEY;
        expect(() => new Pinecone()).toThrow(
          "Since you called 'new Pinecone()' with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: PINECONE_API_KEY. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );
      });
    });
  });

  describe('typescript: generic types for index metadata', () => {
    test('passes generic types from index()', async () => {
      type ProductMetadata = {
        color: 'red' | 'blue' | 'white' | 'black';
        description: string;
      };

      const p = new Pinecone({ apiKey: 'foo' });
      const i = p.index<ProductMetadata>('product-embeddings');

      const result = await i.fetch(['1']);
      if (result && result.records) {
        // No ts error
        console.log(result.records['1'].metadata?.color);

        // @ts-expect-error because colour not in ProductMetadata
        console.log(result.records['1'].metadata.colour);
      }

      // No ts errors when passing ProductMetadata
      await i.upsert([
        {
          id: 'party-shirt',
          values: [0.1, 0.1, 0.1],
          metadata: { color: 'black', description: 'sexy black dress' },
        },
      ]);

      await i.upsert([
        {
          id: 'pink-shirt',
          values: [0.1, 0.1, 0.1],
          // @ts-expect-error becuase 'pink' not a valid value for ProductMeta color field
          metadata: { color: 'pink', description: 'pink shirt' },
        },
      ]);
    });
  });
});
