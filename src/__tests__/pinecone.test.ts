import { Pinecone } from '../pinecone';
import type { PineconeConfiguration } from '../data';

describe('Pinecone', () => {
  describe('constructor', () => {
    describe('required properties', () => {
      test('should throw an error if no properties provided', () => {
        expect(() => {
          new Pinecone({} as PineconeConfiguration);
        }).toThrow(
          'The client configuration must have required properties: environment, apiKey.'
        );
      });

      test('should throw an error if required property not provided', () => {
        expect(() => {
          new Pinecone({ apiKey: 'test-key' } as PineconeConfiguration);
        }).toThrow(
          'The client configuration must have required property: environment.'
        );

        expect(() => {
          new Pinecone({
            environment: 'test-environment',
          } as PineconeConfiguration);
        }).toThrow(
          'The client configuration must have required property: apiKey.'
        );
      });

      test('should throw an error if required properties are blank', () => {
        expect(() => {
          new Pinecone({
            environment: '',
            projectId: '',
            apiKey: 'test-key',
          });
        }).toThrow(
          "The client configuration had validation errors: property 'environment' must not be blank, property 'projectId' must not be blank."
        );

        expect(() => {
          const config = {
            environment: 'test-env',
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
            environment: 'test-env',
            apiKey: 'test-key',
            projectId: 'test-proj',
            unknownProp: 'banana',
          } as PineconeConfiguration);
        }).toThrow(
          'The client configuration had validation errors: argument must NOT have additional properties.'
        );
      });
    });

    describe('configuration with environment variables', () => {
      beforeEach(() => {
        delete process.env.PINECONE_ENVIRONMENT;
        delete process.env.PINECONE_API_KEY;
        delete process.env.PINECONE_PROJECT_ID;
      });

      test('should read required properties from environment variables if no config object provided', () => {
        process.env.PINECONE_ENVIRONMENT = 'test-env';
        process.env.PINECONE_API_KEY = 'test-api';

        const client = new Pinecone();

        expect(client).toBeDefined();
        expect(client.getConfig().environment).toEqual('test-env');
        expect(client.getConfig().apiKey).toEqual('test-api');
        expect(client.getConfig().projectId).toEqual(undefined);
      });

      test('should read projectId and skip whoami if provided', () => {
        process.env.PINECONE_ENVIRONMENT = 'test-env';
        process.env.PINECONE_API_KEY = 'test-api';
        process.env.PINECONE_PROJECT_ID = 'test-project';

        const client = new Pinecone();

        expect(client.getConfig().projectId).toEqual('test-project');
        expect(global.fetch).not.toHaveBeenCalled();
      });

      test('config object should take precedence when both config object and environment variables are provided', () => {
        process.env.PINECONE_ENVIRONMENT = 'test';
        process.env.PINECONE_API_KEY = 'test';
        const client = new Pinecone({
          environment: 'test2',
          apiKey: 'test2',
        });
        expect(client).toBeDefined();
        expect(client.getConfig().environment).toEqual('test2');
        expect(client.getConfig().apiKey).toEqual('test2');
      });

      test('should throw an error if required environment variable is not set', () => {
        process.env.PINECONE_ENVIRONMENT = 'test';
        delete process.env.PINECONE_API_KEY;
        expect(() => new Pinecone()).toThrow(
          "Since you called 'new Pinecone()' with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: PINECONE_API_KEY. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );
      });
    });
  });
});
