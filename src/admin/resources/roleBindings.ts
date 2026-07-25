import {
  type CreateRoleBindingRequest,
  type ListRoleBindingsRequest,
  type RoleBinding,
  type RoleBindingList,
  type RoleBindingsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for creating a new role binding (the body of `admin.roleBindings.create`). Aliased from
 * the generated {@link CreateRoleBindingRequest}. `principalType` is one of `user`,
 * `service_account`, `api_key`, or `invite`; `resourceType` is `organization` or `project`
 * (`resourceId` is required for `project` scope and omitted for `organization` scope).
 */
export type CreateRoleBindingOptions = CreateRoleBindingRequest;

/**
 * Options for listing role bindings (the filters and pagination query of `admin.roleBindings.list`).
 * Aliased from the generated {@link ListRoleBindingsRequest} with the SDK-managed API-version header
 * removed. All fields are optional filters; `principalType` is required alongside `principalId`, and
 * `resourceType` alongside `resourceId`.
 */
export type ListRoleBindingsOptions = Omit<
  ListRoleBindingsRequest,
  'xPineconeApiVersion'
>;

/**
 * Operations for managing role bindings, which grant roles to principals (users, service accounts,
 * API keys, and invites) at an organization or project scope. Accessed via
 * {@link AdminClient.roleBindings}.
 */
export class RoleBindingsResource {
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
      createRoleBindingRequest: options,
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
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
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
