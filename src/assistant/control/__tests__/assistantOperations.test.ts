import {
  Assistant,
  ManageAssistantsApi,
  GetAssistantRequest,
  DeleteAssistantRequest,
  ListAssistantsRequest,
  ListAssistants200Response,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_control';
import { describeAssistant } from '../describeAssistant';
import { deleteAssistant } from '../deleteAssistant';
import { listAssistants } from '../listAssistants';

const setupManageAssistantsApi = () => {
  const fakeGetAssistant: (req: GetAssistantRequest) => Promise<Assistant> =
    jest.fn().mockImplementation(() =>
      Promise.resolve({
        name: 'test-assistant',
        status: 'Ready',
        instructions: 'test instructions',
        metadata: { key: 'value' },
        host: 'https://test-host.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

  const fakeDeleteAssistant: (req: DeleteAssistantRequest) => Promise<void> =
    jest.fn().mockImplementation(() => Promise.resolve());

  const fakeListAssistants: (
    req: ListAssistantsRequest,
  ) => Promise<ListAssistants200Response> = jest.fn().mockImplementation(() =>
    Promise.resolve({
      assistants: [
        {
          name: 'assistant-1',
          status: 'Ready',
          host: 'https://test-host.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'assistant-2',
          status: 'Initializing',
          host: 'https://test-host.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }),
  );

  const MAP = {
    getAssistant: fakeGetAssistant,
    deleteAssistant: fakeDeleteAssistant,
    listAssistants: fakeListAssistants,
  } as ManageAssistantsApi;
  return MAP;
};

describe('describeAssistant', () => {
  let manageAssistantsApi: ManageAssistantsApi;

  beforeEach(() => {
    manageAssistantsApi = setupManageAssistantsApi();
  });

  test('throws error when name is not provided', async () => {
    await expect(describeAssistant(manageAssistantsApi)('')).rejects.toThrow(
      'You must pass the name of an assistant to update.',
    );
  });

  test('calls getAssistant with correct parameters', async () => {
    await describeAssistant(manageAssistantsApi)('test-assistant');

    expect(manageAssistantsApi.getAssistant).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });
});

describe('deleteAssistant', () => {
  let manageAssistantsApi: ManageAssistantsApi;

  beforeEach(() => {
    manageAssistantsApi = setupManageAssistantsApi();
  });

  test('throws error when name is not provided', async () => {
    await expect(deleteAssistant(manageAssistantsApi)('')).rejects.toThrow(
      'You must pass the name of an assistant to delete.',
    );
  });

  test('calls deleteAssistant with correct parameters', async () => {
    await deleteAssistant(manageAssistantsApi)('test-assistant');

    expect(manageAssistantsApi.deleteAssistant).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('resolves successfully when delete completes', async () => {
    await expect(
      deleteAssistant(manageAssistantsApi)('test-assistant'),
    ).resolves.toBeUndefined();
  });
});

describe('listAssistants', () => {
  let manageAssistantsApi: ManageAssistantsApi;

  beforeEach(() => {
    manageAssistantsApi = setupManageAssistantsApi();
  });

  test('calls listAssistants with correct parameters', async () => {
    await listAssistants(manageAssistantsApi)();

    expect(manageAssistantsApi.listAssistants).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });
});
