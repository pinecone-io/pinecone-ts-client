import {
  MetricsApi,
  MetricsAlignmentRequest,
} from '../../pinecone-generated-ts-fetch/assistant_evaluation';

/**
 * The `Eval` interface defines the structure of the input object for the `evaluate` method.
 */
export interface Eval {
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

/**
 * Evaluates a question against a given answer and a ground truth answer.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * await pc.assistant.evaluate({
 *    question: "What is the capital of France?",
 *    answer: "Lyon is France's capital city",
 *    groundTruth: "Paris is the capital city of France"
 *   });
 * // {
 * //  metrics: { correctness: 0, completeness: 0, alignment: 0 }, // 0s across the board indicates incorrect
 * //  reasoning: { evaluatedFacts: [ [Object] ] },
 * //  usage: { promptTokens: 1134, completionTokens: 21, totalTokens: 1155 }
 * // }
 * ```
 * @param options - An {@link Eval} object containing the question, the answer, and a ground truth answer to
 * evaluate.
 * @returns A Promise that resolves to an {@link AlignmentResponse} object.
 */
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
