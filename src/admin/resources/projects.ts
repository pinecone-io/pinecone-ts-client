import {
  type CreateProjectRequest,
  type Project,
  type ProjectList,
  type ProjectsApi,
  type UpdateProjectRequest,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for {@link ProjectsResource.create}.
 */
export type CreateProjectOptions = CreateProjectRequest;

/**
 * Fields to change with {@link ProjectsResource.update}.
 */
export type UpdateProjectOptions = UpdateProjectRequest;

/**
 * Projects group indexes, assistants, and API keys within an organization.
 * Access this resource through {@link AdminClient.projects}; do not construct it directly.
 * Use {@link AdminClient.organizations} to manage the parent organization.
 *
 * @example
 * ```typescript
 * import { AdminClient } from '@pinecone-database/pinecone';
 *
 * const admin = new AdminClient();
 * const result = await admin.projects.list();
 * ```
 */
export class ProjectsResource {
  private readonly _api: ProjectsApi;

  constructor(api: ProjectsApi) {
    this._api = api;
  }

  /**
   * Creates a project.
   *
   * @param options - A descriptive project name, such as `product-search`.
   * @returns The project details, including its `id`.
   * @throws {@link Errors.PineconeArgumentError} when the project name is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const project = await admin.projects.create({ name: 'product-search' });
   * console.log(project.id);
   * ```
   */
  async create(options: CreateProjectOptions): Promise<Project> {
    if (!options || !options.name) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `name` in order to create a project.',
      );
    }
    return await this._api.createProject({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createProjectRequest: options,
    });
  }

  /**
   * Retrieves a project by ID.
   *
   * @param projectId - The project ID returned when it was created or listed.
   * @returns The project details.
   * @throws {@link Errors.PineconeArgumentError} when `projectId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.projects.describe('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b');
   * console.log(result);
   * ```
   */
  async describe(projectId: string): Promise<Project> {
    if (!projectId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `projectId` in order to describe a project.',
      );
    }
    return await this._api.fetchProject({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId,
    });
  }

  /**
   * Lists all projects in the organization.
   *
   * @returns Results in `data`.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.projects.list();
   * console.log(result.data);
   * ```
   */
  async list(): Promise<ProjectList> {
    return await this._api.listProjects({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /**
   * Updates a project. Omitted fields remain unchanged.
   *
   * @param projectId - The ID of the project to update.
   * @param options - Fields to change, such as `name`.
   * @returns The updated project details.
   * @throws {@link Errors.PineconeArgumentError} when `projectId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * const result = await admin.projects.update('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b', {
   *   name: 'product-search-prod',
   * });
   * console.log(result);
   * ```
   */
  async update(
    projectId: string,
    options: UpdateProjectOptions,
  ): Promise<Project> {
    if (!projectId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `projectId` in order to update a project.',
      );
    }
    return await this._api.updateProject({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId,
      updateProjectRequest: options ?? {},
    });
  }

  /**
   * Deletes a project. Delete its indexes, assistants, backups, and collections first.
   *
   * @param projectId - The ID of the project to delete.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `projectId` is empty.
   *
   * @example
   * ```typescript
   * import { AdminClient } from '@pinecone-database/pinecone';
   *
   * const admin = new AdminClient();
   * await admin.projects.delete('8a3e2d1c-0b9f-4e6d-8c7b-5a4f3e2d1c0b');
   * ```
   */
  async delete(projectId: string): Promise<void> {
    if (!projectId) {
      throw new PineconeArgumentError(
        'You must pass a non-empty string for `projectId` in order to delete a project.',
      );
    }
    return await this._api.deleteProject({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId,
    });
  }
}
