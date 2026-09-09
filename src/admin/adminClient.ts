import {
  type AdminClientConfiguration,
  resolveAdminClientConfiguration,
} from './adminClientConfiguration';
import { adminOperationsBuilder } from './adminOperationsBuilder';
import { ProjectsResource } from './resources/projects';
import { OrganizationsResource } from './resources/organizations';
import { ApiKeysResource } from './resources/apiKeys';
import { ServiceAccountsResource } from './resources/serviceAccounts';
import { RoleBindingsResource } from './resources/roleBindings';
import { InvitesResource } from './resources/invites';
import { UsersResource } from './resources/users';

/**
 * The Admin client manages organizations, projects, and access to them.
 * Create it with service account credentials, supplied through {@link AdminClientConfiguration}
 * or `PINECONE_CLIENT_ID` and `PINECONE_CLIENT_SECRET`.
 * Use {@link Pinecone} with a project API key for index and data operations.
 *
 * Credentials are exchanged on the first request. The client does not refresh an expired
 * authentication token; create a new client if the token expires.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const projects = await admin.projects.list();
 * ```
 */
export class AdminClient {
  /** Operations for managing projects. */
  readonly projects: ProjectsResource;
  /** Operations for managing organizations. */
  readonly organizations: OrganizationsResource;
  /** Operations for managing API keys within a project. */
  readonly apiKeys: ApiKeysResource;
  /** Operations for managing service accounts within the organization. */
  readonly serviceAccounts: ServiceAccountsResource;
  /** Operations for managing role bindings. */
  readonly roleBindings: RoleBindingsResource;
  /** Operations for managing invitations to join the organization. */
  readonly invites: InvitesResource;
  /** Operations for managing users within the organization. */
  readonly users: UsersResource;

  /**
   * Creates a client for administering Pinecone resources.
   *
   * @param config - Service account credentials and request settings. Omit credentials to read
   * `PINECONE_CLIENT_ID` and `PINECONE_CLIENT_SECRET` from the environment.
   * @throws {@link Errors.PineconeConfigurationError} when either credential is missing.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const projects = await admin.projects.list();
   * ```
   */
  constructor(config?: AdminClientConfiguration) {
    const resolvedConfig = resolveAdminClientConfiguration(config);
    const apis = adminOperationsBuilder(resolvedConfig);

    this.projects = new ProjectsResource(apis.projects);
    this.organizations = new OrganizationsResource(apis.organizations);
    this.apiKeys = new ApiKeysResource(apis.apiKeys);
    this.serviceAccounts = new ServiceAccountsResource(apis.serviceAccounts);
    this.roleBindings = new RoleBindingsResource(apis.roleBindings);
    this.invites = new InvitesResource(apis.invites);
    this.users = new UsersResource(apis.users);
  }
}
