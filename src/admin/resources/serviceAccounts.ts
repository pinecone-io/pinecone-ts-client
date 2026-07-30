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
 * Options for creating a new service account (the body of `admin.serviceAccounts.create`). Aliased
 * from the generated {@link CreateServiceAccountRequest}. Omitting `roleBindings` creates the
 * service account with no role bindings; roles can be added later via {@link AdminClient.roleBindings}.
 */
export type CreateServiceAccountOptions = CreateServiceAccountRequest;

/**
 * Options for updating an existing service account (the body of `admin.serviceAccounts.update`).
 * Aliased from the generated {@link UpdateServiceAccountRequest}.
 */
export type UpdateServiceAccountOptions = UpdateServiceAccountRequest;

/**
 * Options for listing service accounts (the pagination query of `admin.serviceAccounts.list`).
 */
export type ListServiceAccountsOptions = Omit<
  ListServiceAccountsRequest,
  'xPineconeApiVersion'
>;

/**
 * Operations for managing service accounts within the organization. Accessed via
 * {@link AdminClient.serviceAccounts}.
 */
export class ServiceAccountsResource {
  private readonly _api: ServiceAccountsApi;

  constructor(api: ServiceAccountsApi) {
    this._api = api;
  }

  /**
   * Create a new service account. The returned {@link ServiceAccountWithSecret} contains the OAuth
   * client secret, which is returned only once and cannot be retrieved later.
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

  /** Get a service account's details by ID. */
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

  /** List all service accounts within the organization. */
  async list(
    options: ListServiceAccountsOptions = {},
  ): Promise<ServiceAccountList> {
    return await this._api.listServiceAccounts({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /** Update an existing service account by ID. */
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
   * Rotate the OAuth client secret for a service account by ID. The returned
   * {@link ServiceAccountWithSecret} contains the new secret, which is returned only once; the
   * previous secret is invalidated.
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

  /** Delete a service account by ID. */
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
