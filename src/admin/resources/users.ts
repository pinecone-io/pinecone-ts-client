import {
  type ListUsersRequest,
  type User,
  type UserList,
  type UsersApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for {@link UsersResource.list}.
 */
export type ListUsersOptions = Omit<ListUsersRequest, 'xPineconeApiVersion'>;

/**
 * Users are people who belong to your organization.
 * Access this resource through {@link AdminClient.users}; do not construct it directly.
 * Use {@link AdminClient.invites} to invite new members.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.users.list();
 * ```
 */
export class UsersResource {
  private readonly _api: UsersApi;

  constructor(api: UsersApi) {
    this._api = api;
  }

  /**
   * Retrieves a user by ID.
   *
   * @param userId - The user ID returned by {@link UsersResource.list}.
   * @returns The user details.
   * @throws {@link Errors.PineconeArgumentError} when `userId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.users.describe('bf77a06e-cd10-41c8-af91-a7fa389dce2c');
   * console.log(result);
   * ```
   */
  async describe(userId: string): Promise<User> {
    if (!userId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `userId` in order to describe a user.',
      );
    }
    return await this._api.fetchUser({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      userId,
    });
  }

  /**
   * Lists one page of users, optionally filtered by email.
   *
   * @param options - Filters and pagination settings. Omit to fetch the first page without filters.
   * @returns Results in `data`; pass `pagination.next` as `paginationToken` to fetch the next page.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.users.list({ limit: 10 });
   * console.log(result.data);
   * ```
   */
  async list(options: ListUsersOptions = {}): Promise<UserList> {
    return await this._api.listUsers({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Removes a user from the organization.
   *
   * @param userId - The ID of the user to remove.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `userId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.users.delete('bf77a06e-cd10-41c8-af91-a7fa389dce2c');
   * ```
   */
  async delete(userId: string): Promise<void> {
    if (!userId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `userId` in order to delete a user.',
      );
    }
    return await this._api.deleteUser({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      userId,
    });
  }
}
