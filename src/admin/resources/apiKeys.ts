import {
  type APIKey,
  type APIKeysApi,
  type APIKeyWithSecret,
  type ListApiKeysResponse,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for creating a new API key. */
export interface CreateApiKeyOptions {
  /** The name of the API key. Must be 1-80 characters long. */
  name: string;
  /**
   * The roles to create the API key with. Defaults to `['ProjectEditor']`. Expected values:
   * `ProjectEditor`, `ProjectViewer`, `ControlPlaneEditor`, `ControlPlaneViewer`,
   * `DataPlaneEditor`, `DataPlaneViewer`.
   */
  roles?: Array<string>;
}

/** The options for updating an existing API key. */
export interface UpdateApiKeyOptions {
  /** A new name for the API key. Must be 1-80 characters long. If omitted, the name is unchanged. */
  name?: string;
  /**
   * A new set of roles for the API key. Existing roles are removed if not included. If omitted, the
   * roles are unchanged.
   */
  roles?: Array<string>;
}

/**
 * Operations for managing API keys within a project. Accessed via {@link AdminClient.apiKeys}.
 */
export class ApiKeysNamespace {
  private readonly _api: APIKeysApi;

  constructor(api: APIKeysApi) {
    this._api = api;
  }

  /**
   * Create a new API key within a project. The returned {@link APIKeyWithSecret} contains the key's
   * secret value, which is returned only once and cannot be retrieved later.
   */
  async create(
    projectId: string,
    options: CreateApiKeyOptions,
  ): Promise<APIKeyWithSecret> {
    if (!projectId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `projectId` in order to create an API key.',
      );
    }
    if (!options || !options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create an API key.',
      );
    }
    return await this._api.createApiKey({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId,
      createAPIKeyRequest: {
        name: options.name,
        roles: options.roles,
      },
    });
  }

  /** Get an API key's details by ID. */
  async describe(apiKeyId: string): Promise<APIKey> {
    if (!apiKeyId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `apiKeyId` in order to describe an API key.',
      );
    }
    return await this._api.fetchApiKey({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId,
    });
  }

  /** List all API keys within a project. */
  async list(projectId: string): Promise<ListApiKeysResponse> {
    if (!projectId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `projectId` in order to list API keys.',
      );
    }
    return await this._api.listProjectApiKeys({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId,
    });
  }

  /** Update an existing API key by ID. */
  async update(
    apiKeyId: string,
    options: UpdateApiKeyOptions,
  ): Promise<APIKey> {
    if (!apiKeyId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `apiKeyId` in order to update an API key.',
      );
    }
    return await this._api.updateApiKey({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId,
      updateAPIKeyRequest: {
        name: options?.name,
        roles: options?.roles,
      },
    });
  }

  /** Delete an API key by ID. */
  async delete(apiKeyId: string): Promise<void> {
    if (!apiKeyId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `apiKeyId` in order to delete an API key.',
      );
    }
    return await this._api.deleteApiKey({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId,
    });
  }
}
