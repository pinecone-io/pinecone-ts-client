import {
  type Project,
  type ProjectList,
  type ProjectsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../errors';

/** The options for creating a new project. */
export interface CreateProjectOptions {
  /** The name of the new project. */
  name: string;
  /** The maximum number of Pods that can be created in the project. Defaults to `0` (serverless only). */
  maxPods?: number;
  /**
   * Whether to force encryption with a customer-managed encryption key (CMEK). Defaults to `false`.
   * Once enabled, CMEK encryption cannot be disabled.
   */
  forceEncryptionWithCmek?: boolean;
}

/** The options for updating an existing project. */
export interface UpdateProjectOptions {
  /** A new name for the project. */
  name?: string;
  /** The maximum number of Pods that can be created in the project. */
  maxPods?: number;
  /**
   * Whether to force encryption with a customer-managed encryption key (CMEK). Once enabled, CMEK
   * encryption cannot be disabled.
   */
  forceEncryptionWithCmek?: boolean;
}

/**
 * Operations for managing Pinecone projects within the organization associated with your service
 * account. Accessed via {@link AdminClient.projects}.
 */
export class ProjectsNamespace {
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
      createProjectRequest: {
        name: options.name,
        maxPods: options.maxPods,
        forceEncryptionWithCmek: options.forceEncryptionWithCmek,
      },
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
      updateProjectRequest: {
        name: options?.name,
        maxPods: options?.maxPods,
        forceEncryptionWithCmek: options?.forceEncryptionWithCmek,
      },
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
