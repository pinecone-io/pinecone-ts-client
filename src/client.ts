import { PineconeConfigurationError } from './errors';
import type { ClientConfiguration } from './types';
import type { ConfigurationParameters as IndexOperationsApiConfigurationParameters } from './pinecone-generated-ts-fetch';
import {
  IndexOperationsApi,
  Configuration as ApiConfiguration,
} from './pinecone-generated-ts-fetch';
import { describeIndex, listIndexes } from './control';

export class Client {
  private config: ClientConfiguration;

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

    this['describeIndex'] = describeIndex(api);
    this['listIndexes'] = listIndexes(api);
  }

  _validateConfig(options: ClientConfiguration) {
    const requiredProperties = ['environment', 'apiKey', 'projectId'];
    if (!options) {
      throw new PineconeConfigurationError(
        `Cannot create client without a configuration object containing required keys: ${requiredProperties.join(
          ', '
        )}.`
      );
    }

    for (const key of requiredProperties) {
      if (options[key] === undefined) {
        throw new PineconeConfigurationError(
          `Client configuration missing required property '${key}'.`
        );
      }

      if (!options[key]) {
        throw new PineconeConfigurationError(
          `Required client configuration value '${key}' cannot be blank.}`
        );
      }
    }

    const knownProperties = requiredProperties;
    for (const key of Object.keys(options)) {
      if (!knownProperties.includes(key)) {
        throw new PineconeConfigurationError(
          `Cannot create client with unknown configuration property '${key}'. Allowed properties: ${knownProperties.join(
            ', '
          )}.`
        );
      }
    }
  }

  getConfig() {
    return this.config;
  }
}
