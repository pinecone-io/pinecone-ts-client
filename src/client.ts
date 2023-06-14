import { PineconeConfigurationError } from './errors';
import type { ClientConfiguration } from './pinecone';

export class Client {
  private config: ClientConfiguration;

  constructor(options: ClientConfiguration) {
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

    this.config = options;
  }

  getConfig() {
    return this.config;
  }
}
