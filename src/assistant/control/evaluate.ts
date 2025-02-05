import {
  MetricsApi,
  MetricsAlignmentRequest,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import type { AssistantEval } from './types';

export const evaluate = (metricsApi: MetricsApi) => {
  return async (options: AssistantEval) => {
    if (
      options.question == '' ||
      options.answer == '' ||
      options.groundTruth == ''
    ) {
      throw new Error(
        'Invalid input. Question, answer, and groundTruth must be non-empty strings.'
      );
    }

    const request = {
      alignmentRequest: {
        question: options.question,
        answer: options.answer,
        groundTruthAnswer: options.groundTruth,
      },
    } as MetricsAlignmentRequest;
    return metricsApi.metricsAlignment(request);
  };
};
