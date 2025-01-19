import {
  MetricsApi,
  MetricsAlignmentRequest,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';

/**
 * The `AssistantEval` interface defines the structure of the input object for the `evaluate` method.
 */
export interface AssistantEval {
  /**
   * The question to evaluate.
   */
  question: string;
  /**
   * The answer to evaluate.
   */
  answer: string;
  /**
   * The ground truth answer against which evaluate the question-answer pair.
   */
  groundTruth: string;
}

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
