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
 * Options for {@link RoleBindingsResource.create}. `principalType`
 * is one of `user`, `service_account`, `api_key`, or `invite`; `resourceType` is `organization` or `project`
 * (`resourceId` is required for `project` scope and omitted for `organization` scope).
 */
export type CreateRoleBindingOptions = CreateRoleBindingRequest;

/**
 * Options for {@link RoleBindingsResource.list}.
 * Filters and pagination settings are optional; `principalType` is required alongside `principalId`, and
 * `resourceType` alongside `resourceId`.
 */
export type ListRoleBindingsOptions = Omit<
  ListRoleBindingsRequest,
  'xPineconeApiVersion'
>;

/**
 * Role bindings grant a user, service account, API key, or invite a role on an organization or project.
 * Access this resource through {@link AdminClient.roleBindings}; do not construct it directly.
 * Use {@link AdminClient.invites} to invite someone who is not yet a member.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.roleBindings.list();
 * ```
 */
export class RoleBindingsResource {
  private readonly _api: RoleBindingsApi;

  constructor(api: RoleBindingsApi) {
    this._api = api;
  }

  /**
   * Grants a role to a user, service account, API key, or invite.
   *
   * @param options - The principal, role, and resource scope. Supply `resourceId` for a project-scoped role.
   * @returns The new role binding, including its `id`.
   * @throws {@link Errors.PineconeArgumentError} when the principal ID, principal type, resource type, or role is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const binding = await admin.roleBindings.create({
   *   principalType: 'service_account',
   *   principalId: '7e730a1d-8c0f-48f1-a9a3-1ac66fdd2ef4',
   *   resourceType: 'project',
   *   resourceId: '8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b',
   *   role: 'ProjectViewer',
   * });
   * console.log(binding.id);
   * ```
   */
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

  /**
   * Retrieves a role binding by ID.
   *
   * @param roleBindingId - The role binding ID returned when it was created or listed.
   * @returns The role binding details.
   * @throws {@link Errors.PineconeArgumentError} when `roleBindingId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.roleBindings.describe('17470909-6cb1-4db1-93ef-20ab82595683');
   * console.log(result);
   * ```
   */
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

  /**
   * Lists one page of role bindings, optionally filtered by principal, resource, or role.
   *
   * @param options - Filters and pagination settings. Omit to fetch the first page without filters.
   * @returns Results in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.roleBindings.list({ limit: 10 });
   * console.log(result.data);
   * ```
   */
  async list(options: ListRoleBindingsOptions = {}): Promise<RoleBindingList> {
    return await this._api.listRoleBindings({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Deletes a role binding, removing the role it grants.
   *
   * @param roleBindingId - The ID of the role binding to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `roleBindingId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.roleBindings.delete('17470909-6cb1-4db1-93ef-20ab82595683');
   * ```
   */
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
