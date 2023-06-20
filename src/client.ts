import { PineconeConfigurationError } from './errors';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from './pinecone-generated-ts-fetch';
import {
  IndexOperationsApi,
  Configuration as ApiConfiguration,
} from './pinecone-generated-ts-fetch';
import {
  describeIndex,
  listIndexes,
  createIndex,
  deleteIndex,
} from './control';
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
  createIndex: ReturnType<typeof createIndex>;
  deleteIndex: ReturnType<typeof deleteIndex>;

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
    this.createIndex = createIndex(api);
    this.deleteIndex = deleteIndex(api);
  }

  _validateConfig(options: ClientConfiguration) {
    buildValidator(ClientConfigurationSchema, (errorsList) => {
      const messageParts: Array<string> = [];
      messageParts.push(
        'Configuration passed to Client constructor had a problem.'
      );

      if (
        errorsList.length === 1 &&
        errorsList[0] === 'The argument must be object.'
      ) {
        // This error doesn't really say anything that isn't covered in the other parts
        // of the error message. So leave it out.
      } else {
        messageParts.push(...errorsList);
      }

      const requiredKeys = ['environment', 'apiKey', 'projectId'];
      messageParts.push(
        `Configuration must be an object with keys ${requiredKeys.join(', ')}.`
      );

      throw new PineconeConfigurationError(`${messageParts.join(' ')}`);
    })(options);
  }

  getConfig() {
    return this.config;
  }
}
