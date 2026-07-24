import {
  type RoleBindingInput,
  type ServiceAccount,
  type ServiceAccountList,
  type ServiceAccountsApi,
  type ServiceAccountWithSecret,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for creating a new service account. */
export interface CreateServiceAccountOptions {
  /** The human-readable name of the service account. Must be 1-80 characters long. */
  name: string;
  /**
   * Initial role bindings for the service account. Omitting this creates the service account with
   * no role bindings; roles can be added later via {@link AdminClient.roleBindings}.
   */
  roleBindings?: Array<RoleBindingInput>;
}

/** The options for updating an existing service account. */
export interface UpdateServiceAccountOptions {
  /** A new name for the service account. Must be 1-80 characters long. If omitted, the name is unchanged. */
  name?: string;
}

/** The options for listing service accounts. */
export interface ListServiceAccountsOptions {
  /** The maximum number of service accounts to return per page. */
  limit?: number;
  /** Token used for pagination to retrieve the next page of results. */
  paginationToken?: string;
}

/**
 * Operations for managing service accounts within the organization. Accessed via
 * {@link AdminClient.serviceAccounts}.
 */
export class ServiceAccountsNamespace {
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
      createServiceAccountRequest: {
        name: options.name,
        roleBindings: options.roleBindings,
      },
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
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit: options.limit,
      paginationToken: options.paginationToken,
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
      updateServiceAccountRequest: {
        name: options?.name,
      },
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
