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
 * The name and access roles for {@link ApiKeysResource.create}.
 * Choose roles that grant the operations your application needs.
 */
export type CreateApiKeyOptions = CreateAPIKeyRequest;

/**
 * Fields to change with {@link ApiKeysResource.update}. Any field omitted
 * is left unchanged; supplying `roles` replaces the existing set.
 */
export type UpdateApiKeyOptions = UpdateAPIKeyRequest;

/**
 * API keys authorize a {@link Pinecone} client to access a project.
 * Access this resource through {@link AdminClient.apiKeys}; do not construct it directly.
 * Use {@link AdminClient.serviceAccounts} for organization administration credentials.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.apiKeys.list('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b');
 * ```
 */
export class ApiKeysResource {
  private readonly _api: APIKeysApi;

  constructor(api: APIKeysApi) {
    this._api = api;
  }

  /**
   * Creates an API key for a project. Save its secret value; it cannot be retrieved later.
   *
   * @param projectId - The ID of the project the key will access.
   * @param options - The key name and access roles. Choose roles that match the operations the application needs.
   * @returns The key details in `key` and the secret in `value`.
   * @throws {@link Errors.PineconeArgumentError} when the project ID or key name is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.apiKeys.create('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b', {
   *   name: 'catalog-reader',
   *   roles: ['ProjectViewer'],
   * });
   * console.log(result.key.id);
   * ```
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

  /**
   * Retrieves an API key by ID. The secret value is not returned.
   *
   * @param apiKeyId - The API key ID returned when it was created or listed.
   * @returns The API key details and assigned roles, without the secret value.
   * @throws {@link Errors.PineconeArgumentError} when `apiKeyId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.apiKeys.describe('1c8c262b-6808-4aab-a277-75cac87b6e2f');
   * console.log(result);
   * ```
   */
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

  /**
   * Lists the API keys in a project.
   *
   * @param projectId - The project whose API keys to list.
   * @returns Results in `data`.
   * @throws {@link Errors.PineconeArgumentError} when `projectId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.apiKeys.list('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b');
   * console.log(result.data);
   * ```
   */
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

  /**
   * Updates an API key. Omitted fields remain unchanged.
   *
   * @param apiKeyId - The ID of the API key to update.
   * @param options - Fields to change. Providing `roles` replaces the existing roles.
   * @returns The updated API key details.
   * @throws {@link Errors.PineconeArgumentError} when `apiKeyId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.apiKeys.update('1c8c262b-6808-4aab-a277-75cac87b6e2f', {
   *   name: 'catalog-reader',
   * });
   * console.log(result);
   * ```
   */
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

  /**
   * Deletes an API key, revoking its access.
   *
   * @param apiKeyId - The ID of the API key to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `apiKeyId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.apiKeys.delete('1c8c262b-6808-4aab-a277-75cac87b6e2f');
   * ```
   */
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
