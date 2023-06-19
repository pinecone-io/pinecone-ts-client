import { PineconeConfigurationError } from './errors';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from './pinecone-generated-ts-fetch';
import {
  IndexOperationsApi,
  Configuration as ApiConfiguration,
} from './pinecone-generated-ts-fetch';
import { describeIndex, listIndexes } from './control';
import { buildValidator } from './validator';
import { Static, Type } from '@sinclair/typebox';

const ClientConfigurationSchema = Type.Object(
  {
    environment: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
    projectId: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false }
);

export type ClientConfiguration = Static<typeof ClientConfigurationSchema>;

export class Client {
  private config: ClientConfiguration;

  describeIndex: ReturnType<typeof describeIndex>;
  listIndexes: ReturnType<typeof listIndexes>;

  constructor(options: ClientConfiguration) {
    this._validateConfig(options);

    this.config = options;

    const { apiKey, environment } = options;
    const controllerPath = `https://controller.${environment}.pinecone.io`;
    const apiConfig: IndexOperationsApiConfigurationParameters = {
      basePath: controllerPath,
      apiKey,
    };
    const api = new IndexOperationsApi(new ApiConfiguration(apiConfig));

    this.describeIndex = describeIndex(api);
    this.listIndexes = listIndexes(api);
  }

  _validateConfig(options: ClientConfiguration) {
    buildValidator(ClientConfigurationSchema, (errorsList) => {
      const errorStr =
        'Configuration passed to Client constructor had a problem: ' +
        errorsList.join(',') +
        '.';
      const requiredKeys = ['environment', 'apiKey', 'projectId'];
      const requiredKeysStr = `Configuration must be an object with keys ${requiredKeys.join(
        ', '
      )}.`;
      throw new PineconeConfigurationError(`${errorStr} ${requiredKeysStr}`);
    })(options);
  }

  getConfig() {
    return this.config;
  }
}
