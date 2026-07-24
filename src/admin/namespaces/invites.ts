import {
  type Invite,
  type InviteList,
  type InvitesApi,
  type RoleBindingInput,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for creating and sending a new invite. */
export interface CreateInviteOptions {
  /** The email address to invite. */
  email: string;
  /**
   * Role bindings for the invitee. Must include at least one organization-scoped binding that
   * grants organization membership (e.g. `OrgOwner`, `OrgManager`, `OrgBillingAdmin`, or
   * `OrgMember`); project-scoped bindings are optional.
   */
  roleBindings: Array<RoleBindingInput>;
}

/** The options for listing invites. */
export interface ListInvitesOptions {
  /** The maximum number of invites to return per page. */
  limit?: number;
  /** Token used for pagination to retrieve the next page of results. */
  paginationToken?: string;
}

/**
 * Operations for managing invitations to join the organization. Accessed via
 * {@link AdminClient.invites}.
 */
export class InvitesNamespace {
  private readonly _api: InvitesApi;

  constructor(api: InvitesApi) {
    this._api = api;
  }

  /** Create and send a new invite to join the organization. */
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
      createInviteRequest: {
        email: options.email,
        roleBindings: options.roleBindings,
      },
    });
  }

  /** Get an invite's details by ID. */
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

  /** List invites in the organization. */
  async list(options: ListInvitesOptions = {}): Promise<InviteList> {
    return await this._api.listInvites({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      limit: options.limit,
      paginationToken: options.paginationToken,
    });
  }

  /** Resend an existing invite by ID, extending its expiration. */
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

  /** Delete an invite by ID. */
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
