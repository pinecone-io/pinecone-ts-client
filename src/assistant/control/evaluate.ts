import {
  MetricsApi,
  MetricsAlignmentRequest,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';

export interface Eval {
  question: string;
  answer: string;
  groundTruth: string;
}

export const evaluateClosed = (api: MetricsApi) => {
  return async (options: Eval) => {
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
    return api.metricsAlignment(request);
  };
};
