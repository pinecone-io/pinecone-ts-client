import { evaluate } from '../evaluate';
import {
  AlignmentResponse,
  MetricsAlignmentRequest,
  MetricsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/assistant_evaluation';

const setupMetricsApi = () => {
  const fakeMetricsAlignment: (
    req: MetricsAlignmentRequest,
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
    test('throws error when options is null or undefined', async () => {
      await expect(
        // @ts-expect-error - invalid options
        evaluate(metricsApi)(null),
      ).rejects.toThrow(
        'You must pass an object with required properties (`question`, `answer`, `groundTruth`) to evaluate.',
      );

      await expect(
        // @ts-expect-error - invalid options
        evaluate(metricsApi)(undefined),
      ).rejects.toThrow(
        'You must pass an object with required properties (`question`, `answer`, `groundTruth`) to evaluate.',
      );
    });

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
          'Invalid input. Question, answer, and groundTruth must be non-empty strings.',
        );
      }
    });

    test('calls metricsAlignment with correct parameters', async () => {
      const request = {
        question: 'What is the capital of France?',
        answer: 'Paris',
        groundTruth: 'The capital of France is Paris.',
      };

      await evaluate(metricsApi)(request);

      expect(metricsApi.metricsAlignment).toHaveBeenCalledWith({
        xPineconeApiVersion: X_PINECONE_API_VERSION,
        alignmentRequest: {
          question: request.question,
          answer: request.answer,
          groundTruthAnswer: request.groundTruth,
        },
      });
    });
  });
});
