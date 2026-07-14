import {
  MetricsApi,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import type { EvaluateOptions } from './types';
import { PineconeArgumentError } from '../../errors';

export const evaluate = (metricsApi: MetricsApi) => {
  return async (options: EvaluateOptions) => {
    if (!options) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`question`, `answer`, `groundTruth`) to evaluate.',
      );
    }

    if (
      options.question == '' ||
      options.answer == '' ||
      options.groundTruth == ''
    ) {
      throw new PineconeArgumentError(
        'Invalid input. Question, answer, and groundTruth must be non-empty strings.',
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
