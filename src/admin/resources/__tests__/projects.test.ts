import { ProjectsNamespace } from '../projects';
import {
  type ProjectsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../../errors';

const setup = () => {
  const api = {
    createProject: jest.fn().mockResolvedValue({ id: 'p-1' }),
    fetchProject: jest.fn().mockResolvedValue({ id: 'p-1' }),
    listProjects: jest.fn().mockResolvedValue({ data: [] }),
    updateProject: jest.fn().mockResolvedValue({ id: 'p-1' }),
    deleteProject: jest.fn().mockResolvedValue(undefined),
  } as unknown as ProjectsApi;
  return { api, projects: new ProjectsNamespace(api) };
};

describe('ProjectsNamespace', () => {
  test('create passes name and options through with the API version', async () => {
    const { api, projects } = setup();
    await projects.create({ name: 'my-project', maxPods: 2 });
    expect(api.createProject).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createProjectRequest: {
        name: 'my-project',
        maxPods: 2,
        forceEncryptionWithCmek: undefined,
      },
    });
  });

  test('create throws when name is missing', async () => {
    const { projects } = setup();
    await expect(projects.create({} as never)).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('describe passes the projectId through', async () => {
    const { api, projects } = setup();
    await projects.describe('p-123');
    expect(api.fetchProject).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId: 'p-123',
    });
  });

  test('describe throws when projectId is empty', async () => {
    const { projects } = setup();
    await expect(projects.describe('')).rejects.toThrow(PineconeArgumentError);
  });

  test('list calls the API with the version header', async () => {
    const { api, projects } = setup();
    await projects.list();
    expect(api.listProjects).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('update passes projectId and body through', async () => {
    const { api, projects } = setup();
    await projects.update('p-9', { name: 'renamed' });
    expect(api.updateProject).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId: 'p-9',
      updateProjectRequest: {
        name: 'renamed',
        maxPods: undefined,
        forceEncryptionWithCmek: undefined,
      },
    });
  });

  test('update throws when projectId is empty', async () => {
    const { projects } = setup();
    await expect(projects.update('', { name: 'x' })).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('delete passes the projectId through', async () => {
    const { api, projects } = setup();
    await projects.delete('p-5');
    expect(api.deleteProject).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId: 'p-5',
    });
  });

  test('delete throws when projectId is empty', async () => {
    const { projects } = setup();
    await expect(projects.delete('')).rejects.toThrow(PineconeArgumentError);
  });
});
