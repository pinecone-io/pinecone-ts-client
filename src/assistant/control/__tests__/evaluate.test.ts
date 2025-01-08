import { AssistantCtrlPlane } from '../AssistantCtrlPlane';
import { MetricsApi } from '../../../pinecone-generated-ts-fetch/assistant_evaluation';

describe('AssistantCtrlPlane', () => {
  let assistantCtrlPlane: AssistantCtrlPlane;
  const mockEvalApi = {
    evaluate: jest.fn(),
  } as unknown as MetricsApi;
  const mockConfig = { apiKey: 'test-api-key' };

  beforeAll(() => {
    assistantCtrlPlane = new AssistantCtrlPlane(mockConfig, {
      evalApi: mockEvalApi,
    });
  });

  describe('evaluate', () => {
    test('throws error when empty strings are provided', async () => {
      const emptyRequests = [
        {
          question: '',
          answer: 'test-answer',
          groundTruth: 'test-ground-truth',
        },
        {
          question: 'test-question',
          answer: '',
          groundTruth: 'test-ground-truth',
        },
        {
          question: 'test-question',
          answer: 'test-answer',
          groundTruth: '',
        },
      ];

      for (const request of emptyRequests) {
        await expect(assistantCtrlPlane.evaluate(request)).rejects.toThrow(
          'Invalid input. Question, answer, and groundTruth must be non-empty strings.'
        );
      }
    });
  });
});
