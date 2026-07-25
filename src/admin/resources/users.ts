import {
  type ListUsersRequest,
  type User,
  type UserList,
  type UsersApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for listing users (the filter and pagination query of `admin.users.list`). Aliased from
 * the generated {@link ListUsersRequest} with the SDK-managed API-version header removed.
 */
export type ListUsersOptions = Omit<ListUsersRequest, 'xPineconeApiVersion'>;

/**
 * Operations for managing users within the organization. Accessed via {@link AdminClient.users}.
 */
export class UsersResource {
  private readonly _api: UsersApi;

  constructor(api: UsersApi) {
    this._api = api;
  }

  /** Get a user's details by ID. */
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

  /** List users in the organization, optionally filtered by email. */
  async list(options: ListUsersOptions = {}): Promise<UserList> {
    return await this._api.listUsers({
      ...options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /** Delete a user by ID, removing them from the organization. */
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
