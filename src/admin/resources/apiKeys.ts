import {
  type APIKey,
  type APIKeysApi,
  type APIKeyWithSecret,
  type CreateAPIKeyRequest,
  type ListApiKeysResponse,
  type UpdateAPIKeyRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for creating a new API key (the body of `admin.apiKeys.create`). Aliased from the
 * generated {@link CreateAPIKeyRequest}. Valid `roles` values are `ProjectEditor`, `ProjectViewer`,
 * `ControlPlaneEditor`, `ControlPlaneViewer`, `DataPlaneEditor`, and `DataPlaneViewer`; defaults to
 * `['ProjectEditor']`.
 */
export type CreateApiKeyOptions = CreateAPIKeyRequest;

/**
 * Options for updating an existing API key (the body of `admin.apiKeys.update`). Aliased from the
 * generated {@link UpdateAPIKeyRequest}. Any field omitted is left unchanged; supplying `roles`
 * replaces the existing set.
 */
export type UpdateApiKeyOptions = UpdateAPIKeyRequest;

/**
 * Operations for managing API keys within a project. Accessed via {@link AdminClient.apiKeys}.
 */
export class ApiKeysResource {
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
      createAPIKeyRequest: options,
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
      updateAPIKeyRequest: options ?? {},
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
