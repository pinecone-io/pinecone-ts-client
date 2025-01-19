import {
  Assistant,
  CreateAssistantOperationRequest,
  ManageAssistantsApi,
} from '../../../pinecone-generated-ts-fetch/assistant_control';
import { createAssistant } from '../createAssistant';

const setupManageAssistantsApi = () => {
  const fakeCreateAssistant: (
    req: CreateAssistantOperationRequest
  ) => Promise<Assistant> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({}));

  const MAP = {
    createAssistant: fakeCreateAssistant,
  } as ManageAssistantsApi;
  return MAP;
};

describe('AssistantCtrlPlane', () => {
  let manageAssistantsApi: ManageAssistantsApi;

  beforeEach(() => {
    manageAssistantsApi = setupManageAssistantsApi();
  });

  describe('createAssistant', () => {
    test('throws error when invalid region is provided', async () => {
      const invalidRequest = {
        name: 'test-assistant',
        region: 'invalid-region',
        sourceCollection: 'test-collection',
        model: 'test-model',
      };

      await expect(
        createAssistant(manageAssistantsApi)(invalidRequest)
      ).rejects.toThrow(
        'Invalid region specified. Must be one of "us" or "eu"'
      );
    });

    test('accepts valid regions in different cases', async () => {
      const validRequests = [
        {
          name: 'test-assistant-1',
          region: 'US',
          sourceCollection: 'test-collection',
          model: 'test-model',
        },
        {
          name: 'test-assistant-2',
          region: 'eu',
          sourceCollection: 'test-collection',
          model: 'test-model',
        },
      ];

      for (const request of validRequests) {
        await expect(
          createAssistant(manageAssistantsApi)(request)
        ).resolves.not.toThrow();
      }
    });
  });
});
