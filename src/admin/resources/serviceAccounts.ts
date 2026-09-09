import {
  type CreateServiceAccountRequest,
  type ListServiceAccountsRequest,
  type ServiceAccount,
  type ServiceAccountList,
  type ServiceAccountsApi,
  type ServiceAccountWithSecret,
  type UpdateServiceAccountRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for {@link ServiceAccountsResource.create}. Omitting `roleBindings` creates the
 * service account with no role bindings; roles can be added later via {@link AdminClient.roleBindings}.
 */
export type CreateServiceAccountOptions = CreateServiceAccountRequest;

/**
 * Fields to update with {@link ServiceAccountsResource.update}; omitted fields remain unchanged.
 */
export type UpdateServiceAccountOptions = UpdateServiceAccountRequest;

/**
 * Options for {@link ServiceAccountsResource.list}.
 */
export type ListServiceAccountsOptions = Omit<
  ListServiceAccountsRequest,
  'xPineconeApiVersion'
>;

/**
 * Service accounts authenticate applications that administer an organization.
 * Access this resource through {@link AdminClient.serviceAccounts}; do not construct it directly.
 * Use {@link AdminClient.apiKeys} for project API keys.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.serviceAccounts.list();
 * ```
 */
export class ServiceAccountsResource {
  private readonly _api: ServiceAccountsApi;

  constructor(api: ServiceAccountsApi) {
    this._api = api;
  }

  /**
   * Creates a service account. Save the client secret; it cannot be retrieved later.
   *
   * @param options - The service account name and optional role bindings. Omit bindings to assign roles later.
   * @returns The account details in `serviceAccount` and the secret in `clientSecret`.
   * @throws {@link Errors.PineconeArgumentError} when the service account name is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.serviceAccounts.create({ name: 'catalog-sync' });
   * console.log(result.serviceAccount);
   * ```
   */
  async create(
    options: CreateServiceAccountOptions,
  ): Promise<ServiceAccountWithSecret> {
    if (!options || !options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a service account.',
      );
    }
    return await this._api.createServiceAccount({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createServiceAccountRequest: options,
    });
  }

  /**
   * Retrieves a service account by ID.
   *
   * @param serviceAccountId - The service account ID returned when it was created or listed.
   * @returns The service account details.
   * @throws {@link Errors.PineconeArgumentError} when `serviceAccountId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.serviceAccounts.describe('7e730a1d-8c0f-48f1-a9a3-1ac66fdd2ef4');
   * console.log(result);
   * ```
   */
  async describe(serviceAccountId: string): Promise<ServiceAccount> {
    if (!serviceAccountId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `serviceAccountId` in order to describe a service account.',
      );
    }
    return await this._api.fetchServiceAccount({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      serviceAccountId,
    });
  }

  /**
   * Lists one page of service accounts in the organization.
   *
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns Results in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.serviceAccounts.list({ limit: 10 });
   * console.log(result.data);
   * ```
   */
  async list(
    options: ListServiceAccountsOptions = {},
  ): Promise<ServiceAccountList> {
    return await this._api.listServiceAccounts({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Updates a service account. Omitted fields remain unchanged.
   *
   * @param serviceAccountId - The ID of the service account to update.
   * @param options - Fields to change, such as `name`.
   * @returns The updated service account details.
   * @throws {@link Errors.PineconeArgumentError} when `serviceAccountId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.serviceAccounts.update('7e730a1d-8c0f-48f1-a9a3-1ac66fdd2ef4', {
   *   name: 'catalog-sync-prod',
   * });
   * console.log(result);
   * ```
   */
  async update(
    serviceAccountId: string,
    options: UpdateServiceAccountOptions,
  ): Promise<ServiceAccount> {
    if (!serviceAccountId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `serviceAccountId` in order to update a service account.',
      );
    }
    return await this._api.updateServiceAccount({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      serviceAccountId,
      updateServiceAccountRequest: options ?? {},
    });
  }

  /**
   * Replaces a service account client secret, invalidating the previous secret.
   *
   * Save the new secret; it cannot be retrieved later.
   *
   * @param serviceAccountId - The ID of the service account whose secret to replace.
   * @returns The account details in `serviceAccount` and the new secret in `clientSecret`.
   * @throws {@link Errors.PineconeArgumentError} when the service account ID is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.serviceAccounts.rotateSecret('7e730a1d-8c0f-48f1-a9a3-1ac66fdd2ef4');
   * console.log(result.serviceAccount);
   * ```
   */
  async rotateSecret(
    serviceAccountId: string,
  ): Promise<ServiceAccountWithSecret> {
    if (!serviceAccountId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `serviceAccountId` in order to rotate its secret.',
      );
    }
    return await this._api.rotateServiceAccountSecret({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      serviceAccountId,
    });
  }

  /**
   * Deletes a service account.
   *
   * @param serviceAccountId - The ID of the service account to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `serviceAccountId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.serviceAccounts.delete('7e730a1d-8c0f-48f1-a9a3-1ac66fdd2ef4');
   * ```
   */
  async delete(serviceAccountId: string): Promise<void> {
    if (!serviceAccountId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `serviceAccountId` in order to delete a service account.',
      );
    }
    return await this._api.deleteServiceAccount({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      serviceAccountId,
    });
  }
}
