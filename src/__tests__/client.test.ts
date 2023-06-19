import { Client } from '../client';

describe('Client', () => {
  describe('constructor', () => {
    describe('required properties', () => {
      test('should throw an error if no properties provided', () => {
        expect(() => {
          // @ts-ignore
          new Client();
        }).toThrow(
          'Configuration passed to Client constructor had a problem: must be object. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io'
        );
      });

      test('should throw an error if required property not provided', () => {
        expect(() => {
          // @ts-ignore
          new Client({ apiKey: 'test-key' });
        }).toThrow(
          "Configuration passed to Client constructor had a problem: must have required property 'environment'. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-environment',
          });
        }).toThrow(
          "Configuration passed to Client constructor had a problem: must have required property 'apiKey'. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );
      });

      test('should throw an error if required properties are blank', () => {
        expect(() => {
          // @ts-ignore
          new Client({
            environment: '',
            apiKey: 'test-key',
          });
        }).toThrow(
          "Configuration passed to Client constructor had a problem: the field 'environment' must not be blank. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-env',
            apiKey: '',
          });
        }).toThrow(
          "Configuration passed to Client constructor had a problem: the field 'apiKey' must not be blank. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io"
        );
      });
    });

    describe('unknown properties', () => {
      test('should throw an error if unknown property provided', () => {
        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-env',
            apiKey: 'test-key',
            projectId: 'test-proj',
            unknownProp: 'banana',
          } as any);
        }).toThrow(
          'Configuration passed to Client constructor had a problem: must NOT have additional properties. Configuration must be an object with keys environment, apiKey, projectId. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io'
        );
      });
    });
  });
});
