import {
  type AdminClientConfiguration,
  resolveAdminClientConfiguration,
} from './adminClientConfiguration';
import { adminOperationsBuilder } from './adminOperationsBuilder';
import { ProjectsNamespace } from './namespaces/projects';
import { OrganizationsNamespace } from './namespaces/organizations';
import { ApiKeysNamespace } from './namespaces/apiKeys';
import { ServiceAccountsNamespace } from './namespaces/serviceAccounts';
import { RoleBindingsNamespace } from './namespaces/roleBindings';
import { InvitesNamespace } from './namespaces/invites';
import { UsersNamespace } from './namespaces/users';

/**
 * The `AdminClient` class is the entrypoint for the Pinecone **Admin API**, which manages an
 * organization and its resources: projects, API keys, organization users and invites, service
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
 * The bearer token is fetched lazily on the first admin request, cached, and refreshed automatically
 * before it expires — no token management is required by the caller.
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
  readonly projects: ProjectsNamespace;
  /** Operations for managing organizations. */
  readonly organizations: OrganizationsNamespace;
  /** Operations for managing API keys within a project. */
  readonly apiKeys: ApiKeysNamespace;
  /** Operations for managing service accounts within the organization. */
  readonly serviceAccounts: ServiceAccountsNamespace;
  /** Operations for managing role bindings. */
  readonly roleBindings: RoleBindingsNamespace;
  /** Operations for managing invitations to join the organization. */
  readonly invites: InvitesNamespace;
  /** Operations for managing users within the organization. */
  readonly users: UsersNamespace;

  /**
   * @param config - Optional {@link AdminClientConfiguration}. When omitted, `clientId` and
   * `clientSecret` are read from the `PINECONE_CLIENT_ID` and `PINECONE_CLIENT_SECRET` environment
   * variables.
   * @throws {@link Errors.PineconeConfigurationError} when `clientId` or `clientSecret` cannot be resolved.
   */
  constructor(config?: AdminClientConfiguration) {
    const resolvedConfig = resolveAdminClientConfiguration(config);
    const apis = adminOperationsBuilder(resolvedConfig);

    this.projects = new ProjectsNamespace(apis.projects);
    this.organizations = new OrganizationsNamespace(apis.organizations);
    this.apiKeys = new ApiKeysNamespace(apis.apiKeys);
    this.serviceAccounts = new ServiceAccountsNamespace(apis.serviceAccounts);
    this.roleBindings = new RoleBindingsNamespace(apis.roleBindings);
    this.invites = new InvitesNamespace(apis.invites);
    this.users = new UsersNamespace(apis.users);
  }
}
