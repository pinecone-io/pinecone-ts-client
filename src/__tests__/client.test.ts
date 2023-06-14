import { Client } from '../client';

describe('Client', () => {
  describe('constructor', () => {
    describe('required properties', () => {
      test('should throw an error if no properties provided', () => {
        expect(() => {
          // @ts-ignore
          new Client();
        }).toThrow(
          'Cannot create client without a configuration object containing required keys: environment, apiKey, projectId.'
        );
      });

      test('should throw an error if required property not provided', () => {
        expect(() => {
          // @ts-ignore
          new Client({ apiKey: 'test-key' });
        }).toThrow(
          "Client configuration missing required property 'environment'."
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-environment',
          });
        }).toThrow("Client configuration missing required property 'apiKey'.");
      });

      test('should throw an error if required properties are blank', () => {
        expect(() => {
          // @ts-ignore
          new Client({
            environment: '',
            apiKey: 'test-key',
          });
        }).toThrow(
          "Required client configuration value 'environment' cannot be blank."
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-env',
            apiKey: '',
          });
        }).toThrow(
          "Required client configuration value 'apiKey' cannot be blank."
        );
      });
    });

    describe('optional properties', () => {});

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
          "Cannot create client with unknown configuration property 'unknownProp'. Allowed properties: environment, apiKey, projectId."
        );
      });
    });
  });

  describe('init', () => {
    test('should retrieve the project_id', () => {});

    test('should immediately return if optional projectId is provided', () => {
      const client = new Client({
        environment: 'env',
        apiKey: 'key',
        projectId: 'proj',
      });
      expect(client.getConfig().projectId).toEqual('proj');
    });
  });
});
