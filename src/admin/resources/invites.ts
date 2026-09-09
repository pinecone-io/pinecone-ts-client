import {
  type CreateInviteRequest,
  type Invite,
  type InviteList,
  type InvitesApi,
  type ListInvitesRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for {@link InvitesResource.create}. `roleBindings`
 * must include at least one organization-scoped binding that grants organization membership
 * (e.g. `OrgOwner`, `OrgManager`, `OrgBillingAdmin`, or `OrgMember`); project-scoped bindings are optional.
 */
export type CreateInviteOptions = CreateInviteRequest;

/**
 * Options for {@link InvitesResource.list}.
 */
export type ListInvitesOptions = Omit<
  ListInvitesRequest,
  'xPineconeApiVersion'
>;

/**
 * Invites let people join an organization with assigned roles.
 * Access this resource through {@link AdminClient.invites}; do not construct it directly.
 * Use {@link AdminClient.users} to manage existing members.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.invites.list();
 * ```
 */
export class InvitesResource {
  private readonly _api: InvitesApi;

  constructor(api: InvitesApi) {
    this._api = api;
  }

  /**
   * Creates and sends an invitation to join the organization.
   *
   * @param options - The recipient email and roles to grant. Include an organization-scoped membership role.
   * @returns The invite details, including its `id` and assigned roles.
   * @throws {@link Errors.PineconeArgumentError} when the email is empty or no role binding is provided.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const invite = await admin.invites.create({
   *   email: 'alex@example.com',
   *   roleBindings: [{ resourceType: 'organization', role: 'OrgMember' }],
   * });
   * console.log(invite.id);
   * ```
   */
  async create(options: CreateInviteOptions): Promise<Invite> {
    if (!options || !options.email) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `email` in order to create an invite.',
      );
    }
    if (!options.roleBindings || options.roleBindings.length === 0) {
      throw new PineconeArgumentError(
        'You must pass at least one role binding in `roleBindings` in order to create an invite.',
      );
    }
    return await this._api.createInvite({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createInviteRequest: options,
    });
  }

  /**
   * Retrieves a invite by ID.
   *
   * @param inviteId - The invite ID returned when it was created or listed.
   * @returns The invite details.
   * @throws {@link Errors.PineconeArgumentError} when `inviteId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.invites.describe('648ad735-cf52-4cf4-9949-47c56fd9731f');
   * console.log(result);
   * ```
   */
  async describe(inviteId: string): Promise<Invite> {
    if (!inviteId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `inviteId` in order to describe an invite.',
      );
    }
    return await this._api.fetchInvite({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      inviteId,
    });
  }

  /**
   * Lists one page of invites in the organization.
   *
   * @param options - Page size and continuation token. Omit to fetch the first page with the default size.
   * @returns Results in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.invites.list({ limit: 10 });
   * console.log(result.data);
   * ```
   */
  async list(options: ListInvitesOptions = {}): Promise<InviteList> {
    return await this._api.listInvites({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Resends an invitation and extends its expiration.
   *
   * @param inviteId - The ID of the existing invite to resend.
   * @returns The updated invite details.
   * @throws {@link Errors.PineconeArgumentError} when the invite ID is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const invite = await admin.invites.resend('648ad735-cf52-4cf4-9949-47c56fd9731f');
   * console.log(invite);
   * ```
   */
  async resend(inviteId: string): Promise<Invite> {
    if (!inviteId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `inviteId` in order to resend an invite.',
      );
    }
    return await this._api.resendInvite({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      inviteId,
    });
  }

  /**
   * Deletes an invite.
   *
   * @param inviteId - The ID of the invite to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `inviteId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.invites.delete('648ad735-cf52-4cf4-9949-47c56fd9731f');
   * ```
   */
  async delete(inviteId: string): Promise<void> {
    if (!inviteId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `inviteId` in order to delete an invite.',
      );
    }
    return await this._api.deleteInvite({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      inviteId,
    });
  }
}
