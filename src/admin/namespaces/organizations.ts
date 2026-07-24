import {
  type Organization,
  type OrganizationList,
  type OrganizationsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for updating an existing organization. */
export interface UpdateOrganizationOptions {
  /** A new name for the organization. */
  name?: string;
}

/**
 * Operations for managing the organizations available to your service account. Accessed via
 * {@link AdminClient.organizations}.
 */
export class OrganizationsNamespace {
  private readonly _api: OrganizationsApi;

  constructor(api: OrganizationsApi) {
    this._api = api;
  }

  /** Get an organization's details by ID. */
  async describe(organizationId: string): Promise<Organization> {
    if (!organizationId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `organizationId` in order to describe an organization.',
      );
    }
    return await this._api.fetchOrganization({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      organizationId,
    });
  }

  /** List all organizations available to the authenticated service account. */
  async list(): Promise<OrganizationList> {
    return await this._api.listOrganizations({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /** Update an existing organization by ID. */
  async update(
    organizationId: string,
    options: UpdateOrganizationOptions,
  ): Promise<Organization> {
    if (!organizationId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `organizationId` in order to update an organization.',
      );
    }
    return await this._api.updateOrganization({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      organizationId,
      updateOrganizationRequest: {
        name: options?.name,
      },
    });
  }

  /**
   * Delete an organization by ID. All projects within the organization must be deleted first, or
   * the API will reject the request.
   */
  async delete(organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `organizationId` in order to delete an organization.',
      );
    }
    return await this._api.deleteOrganization({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      organizationId,
    });
  }
}
