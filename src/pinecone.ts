import { Client } from './client';
import {
  PineconeConfigurationError,
  PineconeUnexpectedResponseError,
  PineconeEnvironmentVarsNotSupportedError,
  PineconeUnknownRequestFailure,
  mapHttpStatusError,
} from './errors';

export type ClientConfigurationInit = {
  apiKey: string;
  environment: string;
  projectId?: string;
};

/**
 * This utility class is used to help configure a Pinecone {@link Client} by aggregating
 * configuration from environment variables and method params. Most usage will center on the `createClient`
 * static method.
 *
 * @example
 * ```
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const client = await Pinecone.createClient();
 * ```
 */
export class Pinecone {
  /**
   * This is the primary way to create a new client instance.
   *
   * @example
   * If you would like to configure the client via environment variables, you can invoke this method with no arguments:
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const client = await Pinecone.createClient();
   * ```
   *
   * When no arguments are provided, the client will attempt to read configuration from the following environment variables:
   * - `PINECONE_ENVIRONMENT`
   * - `PINECONE_API_KEY`
   * - `PINECONE_PROJECT_ID` (optional)
   *
   * If a project ID is not provided, the client will fetch it from the Pinecone API.
   *
   * @example
   * If you would like to configure the client via arguments, you can invoke this method with a {@link ClientConfigurationInit} object:
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const client = await Pinecone.createClient({
   *   apiKey: 'my-api-key',
   *   environment: 'us-west1-gcp'
   * });
   * ```
   *
   * This can be useful if your application needs to interact with indexes from multiple projects and relying on environment variables would create a conflict.
   *
   * Whether you are configuring via environment variables or arguments, the client will throw an error if it is unable to read the required configuration.
   *
   * @param options - A {@link ClientConfigurationInit} object containing the configuration for the client.
   * @param options.apiKey - The API key to use for authentication.
   * @param options.environment - The environment to use for the client.
   * @param options.projectId - The project ID to use for the client. If not provided, the project ID will be fetched from the Pinecone API.
   * @throws {@link PineconeConfigurationError} if the client is unable to find the required configuration from either parameters or environment variables.
   * @returns A new {@link Client} instance.
   */
  static async createClient(
    options?: ClientConfigurationInit
  ): Promise<Client> {
    if (options === undefined) {
      options = this._readEnvironmentConfig();
    }

    if (options.projectId) {
      // Have to spread the options here because otherwise TS doesn't know that
      // we've already checked that projectId is defined.
      return new Client({ ...options, projectId: options.projectId });
    } else {
      const projectId = await this._fetchProjectId(options);
      return new Client({ ...options, projectId });
    }
  }

  /**
   * @internal
   * This method is used by {@link Pinecone.createClient} to read configuration from environment variables.
   *
   * It looks for the following environment variables:
   * - `PINECONE_ENVIRONMENT`
   * - `PINECONE_API_KEY`
   * - `PINECONE_PROJECT_ID`
   *
   * @returns A {@link ClientConfigurationInit} object populated with values found in environment variables.
   */
  static _readEnvironmentConfig(): ClientConfigurationInit {
    if (!process || !process.env) {
      throw new PineconeEnvironmentVarsNotSupportedError(
        'Your execution environment does not support reading environment variables from process.env, so a configuration object is required when calling Pinecone.createClient().'
      );
    }

    const environmentConfig = {};
    const requiredEnvVarMap = {
      environment: 'PINECONE_ENVIRONMENT',
      apiKey: 'PINECONE_API_KEY',
    };
    const missingVars: Array<string> = [];
    for (const [key, envVar] of Object.entries(requiredEnvVarMap)) {
      const value = process.env[envVar] || '';
      if (!value) {
        missingVars.push(envVar);
      }
      environmentConfig[key] = value;
    }
    if (missingVars.length > 0) {
      throw new PineconeConfigurationError(
        `Since you called Pinecone.createClient() with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: ${missingVars.join(
          ', '
        )}.`
      );
    }

    const optionalEnvVarMap = { projectId: 'PINECONE_PROJECT_ID' };
    for (const [key, envVar] of Object.entries(optionalEnvVarMap)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        environmentConfig[key] = value;
      }
    }

    return environmentConfig as ClientConfigurationInit;
  }

  static async _fetchProjectId(
    options: ClientConfigurationInit
  ): Promise<string> {
    const { apiKey, environment } = options;
    if (!apiKey) {
      throw new PineconeConfigurationError(
        'Cannot fetch projectId from whoami endpoint without an API key.'
      );
    }
    if (!environment) {
      throw new PineconeConfigurationError(
        'Cannot fetch projectId from whoami endpoint without an environment.'
      );
    }

    const { url, request } = this._buildWhoamiRequest(environment, apiKey);

    let response: Response;
    try {
      response = await fetch(url, request);
    } catch (e: any) {
      // Expected fetch exceptions listed here https://developer.mozilla.org/en-US/docs/Web/API/fetch#exceptions
      // Most are header-related and should never occur since we do not let the user set headers. A TypeError
      // will occur if the connection fails due to invalid environment configuration provided by the user. This is
      // different from server errors handled below because the client is unable to make contact with a Pinecone
      // server at all without a valid environment value.
      if (e instanceof TypeError) {
        throw new PineconeConfigurationError(
          `A network error occured while attempting to connect to ${url}. Are you sure you passed the correct environment? Please check your configuration values and try again. Visit https://status.pinecone.io for overall service health information.`
        );
      } else {
        throw new PineconeUnknownRequestFailure(url, e);
      }
    }

    if (response.status >= 400) {
      throw mapHttpStatusError({
        status: response.status,
        url,
        message: await response.text(),
      });
    }

    let json;
    try {
      json = await response.json();
    } catch (e) {
      throw new PineconeUnexpectedResponseError(
        url,
        response.status,
        await response.text(),
        'The HTTP call succeeded but the response could not be parsed as JSON.'
      );
    }

    if (!json.project_name) {
      throw new PineconeUnexpectedResponseError(
        url,
        response.status,
        await response.text(),
        'The HTTP call succeeded but response did not contain expected project_name.'
      );
    }

    return json.project_name;
  }

  /** @hidden */
  static _buildWhoamiRequest(
    environment: string,
    apiKey: string
  ): { url: string; request: RequestInit } {
    const url = `https://controller.${environment}.pinecone.io/actions/whoami`;
    const request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
    };
    return { url, request };
  }
}
