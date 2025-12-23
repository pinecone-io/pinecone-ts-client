import {
  MetricsApi,
  X_PINECONE_API_VERSION,
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

    return await metricsApi.metricsAlignment({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      alignmentRequest: {
        question: options.question,
        answer: options.answer,
        groundTruthAnswer: options.groundTruth,
      },
    });
  };
};
