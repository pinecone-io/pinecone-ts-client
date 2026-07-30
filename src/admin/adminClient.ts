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
 * The `AdminClient` class is the entrypoint for the Pinecone **Admin API**, which manages an
 * organization and its resources: projects, API keys, users and invites, service
 * accounts, and role bindings.
 *
 * ### Authentication
 *
 * Unlike the {@link Pinecone} client (which authenticates with a project **API key**), the Admin API
 * authenticates with a **service account** using the OAuth2 client-credentials flow. You must supply
 * a `clientId` and `clientSecret`, either directly or via the `PINECONE_CLIENT_ID` /
 * `PINECONE_CLIENT_SECRET` environment variables. Create a service account and its credentials in the
 * [Pinecone console](https://app.pinecone.io) under Organization Settings → Service Accounts.
 *
 * The bearer token is fetched lazily on the first admin request and cached for the lifetime of the
 * `AdminClient`, mirroring the Python and Go SDKs. It is not proactively refreshed, so a client kept
 * alive past the token's server-side expiry (~30 minutes) should be recreated; admin operations are
 * expected to run within a time-bounded session.
 *
 * ### Using environment variables
 *
 * ```bash
 * export PINECONE_CLIENT_ID="your_client_id"
 * export PINECONE_CLIENT_SECRET="your_client_secret"
 * ```
 *
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const projects = await admin.projects.list();
 * ```
 *
 * ### Using a configuration object
 *
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient({
 *   clientId: 'your_client_id',
 *   clientSecret: 'your_client_secret',
 * });
 * ```
 *
 * ### Bridging to the data plane
 *
 * A common workflow uses `AdminClient` to create a project and API key, then passes that key to the
 * {@link Pinecone} client for data operations:
 *
 * ```typescript
 * import { AdminClient, Pinecone } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const project = await admin.projects.create({ name: 'my-project' });
 * const apiKey = await admin.apiKeys.create(project.id, { name: 'my-key' });
 * const pc = new Pinecone({ apiKey: apiKey.value });
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
   * @param config - Optional {@link AdminClientConfiguration}. When omitted, `clientId` and
   * `clientSecret` are read from the `PINECONE_CLIENT_ID` and `PINECONE_CLIENT_SECRET` environment
   * variables.
   * @throws {@link Errors.PineconeConfigurationError} when `clientId` or `clientSecret` cannot be resolved.
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
