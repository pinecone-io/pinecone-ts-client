import type {
  FetchAPI,
  HTTPHeaders,
} from '../pinecone-generated-ts-fetch/admin';
import type { PineconeConfiguration } from '../data';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from '../errors';

/**
 * Configuration for the {@link AdminClient}.
 *
 * The Admin API authenticates with a Pinecone **service account** using the OAuth2
 * client-credentials flow, which is distinct from the `apiKey` used by the {@link Pinecone}
 * client. You must supply a `clientId` and `clientSecret` (either directly or via the
 * `PINECONE_CLIENT_ID` / `PINECONE_CLIENT_SECRET` environment variables). Create a service
 * account and its credentials in the [Pinecone console](https://app.pinecone.io) under
 * Organization Settings → Service Accounts.
 */
export type AdminClientConfiguration = {
  /**
   * The service account OAuth2 client ID. Falls back to the `PINECONE_CLIENT_ID` environment
   * variable when not provided.
   */
  clientId?: string;

  /**
   * The service account OAuth2 client secret. Falls back to the `PINECONE_CLIENT_SECRET`
   * environment variable when not provided.
   */
  clientSecret?: string;

  /**
   * Optional configuration field for specifying the controller host. If not specified, the client
   * will use the default controller host: https://api.pinecone.io.
   */
  controllerHostUrl?: string;

  /**
   * Optional configuration field for specifying the fetch implementation. If not specified, the
   * client will look for fetch in the global scope.
   */
  fetchApi?: FetchAPI;

  /**
   * Optional headers to be included in all requests.
   */
  additionalHeaders?: HTTPHeaders;

  /**
   * Optional sourceTag that is applied to the User-Agent header with all requests.
   */
  sourceTag?: string;

  /**
   * Optional caller information that is applied to the User-Agent header with all requests.
   * Used to identify agentic callers using the SDK (e.g., AI coding assistants).
   */
  caller?: {
    /**
     * Optional provider identifier (e.g., 'google', 'anthropic', 'openai').
     */
    provider?: string;
    /**
     * Required model name (e.g., 'gemini', 'claude-code', 'gpt-4').
     */
    model: string;
  };

  /**
   * Optional configuration field for specifying the maximum number of retries after the initial
   * request. Defaults to 3.
   */
  maxRetries?: number;
};

/**
 * An {@link AdminClientConfiguration} with `clientId` and `clientSecret` guaranteed to be present.
 * Produced by {@link resolveAdminClientConfiguration}.
 *
 * @internal
 */
export type ResolvedAdminClientConfiguration = AdminClientConfiguration & {
  clientId: string;
  clientSecret: string;
};

/**
 * Resolves an {@link AdminClientConfiguration}, filling in `clientId` / `clientSecret` from
 * environment variables when they are not passed explicitly, and validating that both are present.
 *
 * @throws {@link Errors.PineconeConfigurationError} when `clientId` or `clientSecret` cannot be resolved.
 * @internal
 */
export const resolveAdminClientConfiguration = (
  options?: AdminClientConfiguration,
): ResolvedAdminClientConfiguration => {
  const config: AdminClientConfiguration = { ...options };

  if (!config.clientId || !config.clientSecret) {
    const envConfig = readAdminEnvironmentConfig();
    config.clientId = config.clientId || envConfig.clientId;
    config.clientSecret = config.clientSecret || envConfig.clientSecret;
  }

  if (!config.clientId) {
    throw new PineconeConfigurationError(
      'The client configuration must have required property: clientId. You can pass it directly to' +
        ' the AdminClient constructor or set the PINECONE_CLIENT_ID environment variable.',
    );
  }
  if (!config.clientSecret) {
    throw new PineconeConfigurationError(
      'The client configuration must have required property: clientSecret. You can pass it directly' +
        ' to the AdminClient constructor or set the PINECONE_CLIENT_SECRET environment variable.',
    );
  }

  return config as ResolvedAdminClientConfiguration;
};

/**
 * Reads `PINECONE_CLIENT_ID` and `PINECONE_CLIENT_SECRET` from the environment. Unlike the required
 * variables, missing values are returned as empty strings so the caller can decide how to combine
 * them with any explicitly-passed configuration before validating.
 *
 * @internal
 */
const readAdminEnvironmentConfig = (): {
  clientId: string;
  clientSecret: string;
} => {
  if (typeof process === 'undefined' || !process || !process.env) {
    throw new PineconeEnvironmentVarsNotSupportedError(
      'Your execution environment does not support reading environment variables from process.env, so' +
        ' clientId and clientSecret must be passed to the AdminClient constructor.',
    );
  }

  return {
    clientId: process.env.PINECONE_CLIENT_ID || '',
    clientSecret: process.env.PINECONE_CLIENT_SECRET || '',
  };
};

/**
 * Builds a {@link PineconeConfiguration}-shaped object from an {@link AdminClientConfiguration} so
 * the shared `buildUserAgent` / `getFetch` utilities (which expect a `PineconeConfiguration`) can be
 * reused. The Admin API does not authenticate with an `apiKey`, so it is intentionally left empty.
 *
 * @internal
 */
export const toPineconeConfigShim = (
  config: AdminClientConfiguration,
): PineconeConfiguration => ({
  apiKey: '',
  controllerHostUrl: config.controllerHostUrl,
  fetchApi: config.fetchApi,
  additionalHeaders: config.additionalHeaders,
  sourceTag: config.sourceTag,
  caller: config.caller,
  maxRetries: config.maxRetries,
});
