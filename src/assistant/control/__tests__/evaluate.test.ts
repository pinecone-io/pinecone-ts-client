import { evaluate } from '../evaluate';
import {
  AlignmentResponse,
  MetricsAlignmentRequest,
  MetricsApi,
} from '../../../pinecone-generated-ts-fetch/assistant_evaluation';

const setupMetricsApi = () => {
  const fakeMetricsAlignment: (
    req: MetricsAlignmentRequest
  ) => Promise<AlignmentResponse> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({}));

  const MAP = {
    metricsAlignment: fakeMetricsAlignment,
  } as MetricsApi;
  return MAP;
};

describe('AssistantCtrlPlane', () => {
  let metricsApi: MetricsApi;

  beforeAll(() => {
    metricsApi = setupMetricsApi();
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
        await expect(evaluate(metricsApi)(request)).rejects.toThrow(
          'Invalid input. Question, answer, and groundTruth must be non-empty strings.'
        );
      }
    });
  });
});
