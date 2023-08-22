import { Client } from '../client';

describe('Client', () => {
  describe('constructor', () => {
    describe('required properties', () => {
      test('should throw an error if no properties provided', () => {
        expect(() => {
          // @ts-ignore
          new Client();
        }).toThrow(
          'The client configuration had type errors: the argument must be object.'
        );
      });

      test('should throw an error if required property not provided', () => {
        expect(() => {
          // @ts-ignore
          new Client({ apiKey: 'test-key' });
        }).toThrow(
          'The client configuration must have required properties: environment, projectId.'
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-environment',
          });
        }).toThrow(
          'The client configuration must have required properties: apiKey, projectId.'
        );
      });

      test('should throw an error if required properties are blank', () => {
        expect(() => {
          // @ts-ignore
          new Client({
            environment: '',
            projectId: '',
            apiKey: 'test-key',
          });
        }).toThrow(
          "The client configuration had validation errors: property 'environment' must not be blank, property 'projectId' must not be blank."
        );

        expect(() => {
          // @ts-ignore
          new Client({
            environment: 'test-env',
            apiKey: '',
          });
        }).toThrow(
          "The client configuration must have required property: projectId. There were also validation errors: property 'apiKey' must not be blank."
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
          'The client configuration had validation errors: the argument must NOT have additional properties.'
        );
      });
    });
  });
});
