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
 * Options for creating a new project (the body of `admin.projects.create`). Aliased from the
 * generated {@link CreateProjectRequest} so the field set stays in sync with the API on each
 * regeneration.
 */
export type CreateProjectOptions = CreateProjectRequest;

/**
 * Options for updating an existing project (the body of `admin.projects.update`). Aliased from the
 * generated {@link UpdateProjectRequest}.
 */
export type UpdateProjectOptions = UpdateProjectRequest;

/**
 * Operations for managing Pinecone projects within the organization associated with your service
 * account. Accessed via {@link AdminClient.projects}.
 */
export class ProjectsResource {
  private readonly _api: ProjectsApi;

  constructor(api: ProjectsApi) {
    this._api = api;
  }

  /** Create a new project. */
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

  /** Get a project's details by ID. */
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

  /** List all projects in the organization. */
  async list(): Promise<ProjectList> {
    return await this._api.listProjects({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  }

  /** Update an existing project by ID. */
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
   * Delete a project by ID. Delete its indexes, assistants, backups, and collections first, or the
   * API will reject the request.
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
