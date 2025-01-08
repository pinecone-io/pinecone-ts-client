import { AssistantCtrlPlane } from '../AssistantCtrlPlane';
import { ManageAssistantsApi } from '../../../pinecone-generated-ts-fetch/assistant_control';

describe('AssistantCtrlPlane', () => {
  let assistantCtrlPlane: AssistantCtrlPlane;
  const mockApi = {
    createAssistant: jest.fn(),
  } as unknown as ManageAssistantsApi;
  const mockConfig = { apiKey: 'test-api-key' };

  beforeEach(() => {
    assistantCtrlPlane = new AssistantCtrlPlane(mockConfig, {
      assistantApi: mockApi,
    });
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
        assistantCtrlPlane.createAssistant(invalidRequest)
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
          assistantCtrlPlane.createAssistant(request)
        ).resolves.not.toThrow();
      }
    });
  });
});
