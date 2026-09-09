import {
  type Organization,
  type OrganizationList,
  type OrganizationsApi,
  type UpdateOrganizationRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Fields to change with {@link OrganizationsResource.update}.
 */
export type UpdateOrganizationOptions = UpdateOrganizationRequest;

/**
 * Organizations contain the projects and members available to your service account.
 * Access this resource through {@link AdminClient.organizations}; do not construct it directly.
 * Use {@link AdminClient.projects} to manage projects within an organization.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.organizations.list();
 * ```
 */
export class OrganizationsResource {
  private readonly _api: OrganizationsApi;

  constructor(api: OrganizationsApi) {
    this._api = api;
  }

  /**
   * Retrieves an organization by ID.
   *
   * @param organizationId - The organization ID returned when it was created or listed.
   * @returns The organization details.
   * @throws {@link Errors.PineconeArgumentError} when `organizationId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.organizations.describe('6924db3c-f119-48ce-9f5a-7b11ef3a870c');
   * console.log(result);
   * ```
   */
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

  /**
   * Lists the organizations available to the authenticated service account.
   *
   * @returns Results in `data`.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.organizations.list();
   * console.log(result.data);
   * ```
   */
  async list(): Promise<OrganizationList> {
    return await this._api.listOrganizations({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Updates an organization. Omitted fields remain unchanged.
   *
   * @param organizationId - The ID of the organization to update.
   * @param options - Fields to change, such as `name`.
   * @returns The updated organization details.
   * @throws {@link Errors.PineconeArgumentError} when `organizationId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.organizations.update('6924db3c-f119-48ce-9f5a-7b11ef3a870c', {
   *   name: 'Acme Research',
   * });
   * console.log(result);
   * ```
   */
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
      updateOrganizationRequest: options ?? {},
    });
  }

  /**
   * Deletes an organization. Delete its projects first.
   *
   * @param organizationId - The ID of the organization to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `organizationId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.organizations.delete('6924db3c-f119-48ce-9f5a-7b11ef3a870c');
   * ```
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
