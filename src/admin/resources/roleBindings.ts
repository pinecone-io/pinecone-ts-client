import {
  type RoleBinding,
  type RoleBindingList,
  type RoleBindingsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for creating a new role binding. */
export interface CreateRoleBindingOptions {
  /** The kind of principal that receives permissions from the role binding. */
  principalType: string;
  /** The ID of the principal to grant the role to. The format depends on `principalType`. */
  principalId: string;
  /** The kind of resource scope the role binding applies to. */
  resourceType: string;
  /**
   * The ID of the project the binding applies to. Required when `resourceType` is `project`; omit
   * for `organization` scope.
   */
  resourceId?: string;
  /** The role to assign to the principal at the resource scope. */
  role: string;
}

/** The options for listing role bindings. All fields are optional filters. */
export interface ListRoleBindingsOptions {
  /** Filter by principal type. Required when `principalId` is set. */
  principalType?: string;
  /** Filter by principal ID. Requires `principalType`. */
  principalId?: string;
  /** Filter by resource type. Required when `resourceId` is set. */
  resourceType?: string;
  /** Filter by resource ID. Requires `resourceType`. */
  resourceId?: string;
  /** Filter by role. */
  role?: string;
  /** The maximum number of role bindings to return per page. */
  limit?: number;
  /** Token used for pagination to retrieve the next page of results. */
  paginationToken?: string;
}

/**
 * Operations for managing role bindings, which grant roles to principals (users, service accounts,
 * API keys, and invites) at an organization or project scope. Accessed via
 * {@link AdminClient.roleBindings}.
 */
export class RoleBindingsNamespace {
  private readonly _api: RoleBindingsApi;

  constructor(api: RoleBindingsApi) {
    this._api = api;
  }

  /** Create a new role binding. */
  async create(options: CreateRoleBindingOptions): Promise<RoleBinding> {
    if (!options || !options.principalId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `principalId` in order to create a role binding.',
      );
    }
    if (!options.principalType) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `principalType` in order to create a role binding.',
      );
    }
    if (!options.resourceType) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `resourceType` in order to create a role binding.',
      );
    }
    if (!options.role) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `role` in order to create a role binding.',
      );
    }
    return await this._api.createRoleBinding({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createRoleBindingRequest: {
        principalType: options.principalType,
        principalId: options.principalId,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        role: options.role,
      },
    });
  }

  /** Get a role binding's details by ID. */
  async describe(roleBindingId: string): Promise<RoleBinding> {
    if (!roleBindingId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `roleBindingId` in order to describe a role binding.',
      );
    }
    return await this._api.fetchRoleBinding({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      roleBindingId,
    });
  }

  /** List role bindings, optionally filtered by principal, resource, or role. */
  async list(options: ListRoleBindingsOptions = {}): Promise<RoleBindingList> {
    return await this._api.listRoleBindings({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      principalType: options.principalType,
      principalId: options.principalId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      role: options.role,
      limit: options.limit,
      paginationToken: options.paginationToken,
    });
  }

  /** Delete a role binding by ID. */
  async delete(roleBindingId: string): Promise<void> {
    if (!roleBindingId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `roleBindingId` in order to delete a role binding.',
      );
    }
    return await this._api.deleteRoleBinding({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      roleBindingId,
    });
  }
}
