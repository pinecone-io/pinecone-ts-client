import {
  MetricsApi,
  MetricsAlignmentRequest,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';

export interface Eval {
  question: string;
  answer: string;
  groundTruth: string;
}

export const evaluateClosed = (assistantName: string, api: MetricsApi) => {
  return async (options: Eval) => {
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
