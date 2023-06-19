import { Pinecone } from '../pinecone';

describe('Pinecone.createClient', () => {
  describe('when projectId provided', () => {
    test('should create a client without api calls', async () => {
      const client = await Pinecone.createClient({
        environment: 'test-env',
        apiKey: 'test-key',
        projectId: 'abcdefg',
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(client).toBeDefined();
      expect(client.getConfig().projectId).toEqual('abcdefg');
      expect(client.getConfig().environment).toEqual('test-env');
      expect(client.getConfig().apiKey).toEqual('test-key');
    });
  });

  describe('when projectId not provided', () => {
    test('should create a client by fetching id', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ project_name: 'abcdef' }),
        })
      );

      const client = await Pinecone.createClient({
        environment: 'test-env',
        apiKey: 'test-key',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://controller.test-env.pinecone.io/actions/whoami',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'Api-Key': 'test-key' }),
        })
      );
      expect(client).toBeDefined();
      expect(client.getConfig().projectId).toEqual('abcdef');
      expect(client.getConfig().environment).toEqual('test-env');
      expect(client.getConfig().apiKey).toEqual('test-key');
    });

    test('whoami: 500 internal server error', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error' }),
          text: () => Promise.resolve('{ "error": "Internal Server Error" }'),
        })
      );

      const expectToFail = async () => {
        await Pinecone.createClient({
          environment: 'test-env',
          apiKey: 'test-key',
        });
      };

      await expect(expectToFail).rejects.toThrow(
        'An internal server error occured while calling the https://controller.test-env.pinecone.io/actions/whoami endpoint. To see overall service health and learn whether this seems like a large-scale problem or one specific to your request, please go to https://status.pinecone.io/ to view our status page. If you believe the error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client'
      );
    });

    test('displays error if whoami call succeeds but does not include expected data', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          // This is not the expected response shape
          json: () => Promise.resolve({ projects: [{ name: 'projectName' }] }),
          text: () =>
            Promise.resolve('{ "projects": [{ "name": "projectName" }]}'),
        })
      );

      const expectToFail = async () => {
        await Pinecone.createClient({
          environment: 'test-env',
          apiKey: 'test-key',
        });
      };

      await expect(expectToFail()).rejects.toThrow(
        'Unexpected response while calling https://controller.test-env.pinecone.io/actions/whoami. The HTTP call succeeded but response did not contain expected project_name. Status: 200. Body: { "projects": [{ "name": "projectName" }]}'
      );
    });

    test('displays error if whoami call succeeds but response fails to parse as JSON', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          json: () => Promise.reject('parse error'),
          text: () =>
            Promise.resolve('{ "projects": [{ "name": "projectName" }]}'),
        })
      );

      const expectToFail = async () => {
        await Pinecone.createClient({
          environment: 'test-env',
          apiKey: 'test-key',
        });
      };

      await expect(expectToFail()).rejects.toThrow(
        'Unexpected response while calling https://controller.test-env.pinecone.io/actions/whoami. The HTTP call succeeded but the response could not be parsed as JSON. Status: 200. Body: { "projects": [{ "name": "projectName" }]}'
      );
    });
  });

  describe('configuration with environment variables', () => {
    beforeEach(() => {
      delete process.env.PINECONE_ENVIRONMENT;
      delete process.env.PINECONE_API_KEY;
      delete process.env.PINECONE_PROJECT_ID;
    });

    test('should read required properties from environment variables if no config object provided', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ project_name: 'abcdef' }),
        })
      );

      process.env.PINECONE_ENVIRONMENT = 'test-env';
      process.env.PINECONE_API_KEY = 'test-api';

      const client = await Pinecone.createClient();

      expect(client).toBeDefined();
      expect(client.getConfig().environment).toEqual('test-env');
      expect(client.getConfig().apiKey).toEqual('test-api');
      expect(client.getConfig().projectId).toEqual('abcdef');
    });

    test('should read projectId and skip whoami if provided', async () => {
      process.env.PINECONE_ENVIRONMENT = 'test-env';
      process.env.PINECONE_API_KEY = 'test-api';
      process.env.PINECONE_PROJECT_ID = 'test-project';

      const client = await Pinecone.createClient();

      expect(client.getConfig().projectId).toEqual('test-project');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('config object should take precedence when both config object and environment variables are provided', async () => {
      // @ts-ignore
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ project_name: 'abcdef' }),
        })
      );
      process.env.PINECONE_ENVIRONMENT = 'test';
      process.env.PINECONE_API_KEY = 'test';
      const client = await Pinecone.createClient({
        environment: 'test2',
        apiKey: 'test2',
      });
      expect(client).toBeDefined();
      expect(client.getConfig().environment).toEqual('test2');
      expect(client.getConfig().apiKey).toEqual('test2');
    });

    test('should throw an error if required environment variable is not set', async () => {
      process.env.PINECONE_ENVIRONMENT = 'test';
      delete process.env.PINECONE_API_KEY;
      await expect(Pinecone.createClient()).rejects.toThrow(
        'Since you called Pinecone.createClient() with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: PINECONE_API_KEY. You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io'
      );
    });
  });
});
