import {
  ManageAssistantsApi,
  UpdateAssistantOperationRequest,
  UpdateAssistant200Response,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_control';
import { updateAssistant } from '../updateAssistant';

const setupManageAssistantsApi = () => {
  const fakeUpdateAssistant: (
    req: UpdateAssistantOperationRequest,
  ) => Promise<UpdateAssistant200Response> = jest.fn().mockImplementation(() =>
    Promise.resolve({
      assistantName: 'test-assistant',
      instructions: 'updated instructions',
      metadata: { key: 'value' },
    }),
  );

  const MAP = {
    updateAssistant: fakeUpdateAssistant,
  } as ManageAssistantsApi;
  return MAP;
};

describe('updateAssistant', () => {
  let manageAssistantsApi: ManageAssistantsApi;

  beforeEach(() => {
    manageAssistantsApi = setupManageAssistantsApi();
  });

  test('throws error when name is not provided', async () => {
    await expect(
      updateAssistant(manageAssistantsApi)({
        name: '',
        instructions: 'new instructions',
      }),
    ).rejects.toThrow('You must pass the name of an assistant to update.');
  });

  test('calls updateAssistant with correct parameters', async () => {
    const options = {
      name: 'test-assistant',
      instructions: 'new instructions',
      metadata: { key: 'value' },
    };

    await updateAssistant(manageAssistantsApi)(options);

    expect(manageAssistantsApi.updateAssistant).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      updateAssistantRequest: {
        instructions: 'new instructions',
        metadata: { key: 'value' },
      },
    });
  });

  test('updates only instructions when metadata not provided', async () => {
    const options = {
      name: 'test-assistant',
      instructions: 'new instructions',
    };

    await updateAssistant(manageAssistantsApi)(options);

    expect(manageAssistantsApi.updateAssistant).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      updateAssistantRequest: {
        instructions: 'new instructions',
        metadata: undefined,
      },
    });
  });

  test('updates only metadata when instructions not provided', async () => {
    const options = {
      name: 'test-assistant',
      metadata: { key: 'new-value' },
    };

    await updateAssistant(manageAssistantsApi)(options);

    expect(manageAssistantsApi.updateAssistant).toHaveBeenCalledWith({
      assistantName: 'test-assistant',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      updateAssistantRequest: {
        instructions: undefined,
        metadata: { key: 'new-value' },
      },
    });
  });
});
