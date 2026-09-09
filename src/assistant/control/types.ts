import type { Assistant as AssistantModel } from '../../pinecone-generated-ts-fetch/assistant_control';

// Re-export the generated Assistant type as AssistantModel for consistency
export type { AssistantModel };

/**
 * The configuration needed to create an assistant.
 *
 * @example
 * ```typescript
 * import type { CreateAssistantOptions } from '@pinecone-database/pinecone';
 * const options: CreateAssistantOptions = { name: 'support-guide' };
 * ```
 */
export interface CreateAssistantOptions {
  /**
   * The assistant name, such as `support-guide`. Use lowercase letters, numbers, and hyphens.
   */
  name: string;
  /**
   * Description or directive for the assistant to apply to all responses.
   */
  instructions?: string;
  /**
   * Metadata associated with the assistant.
   */
  metadata?: Record<string, string>;
  /**
   * The hosting region: `us` or `eu`. Omit to use the service default.
   */
  region?: string;
}

/**
 * The configuration updates for the assistant.
 *
 * @example
 * ```typescript
 * import type { UpdateAssistantOptions } from '@pinecone-database/pinecone';
 * const options: UpdateAssistantOptions = {
 *   name: 'support-guide',
 *   instructions: 'Cite the uploaded support policies in your answers.',
 * };
 * ```
 */
export interface UpdateAssistantOptions {
  /**
   * The name of the assistant to update.
   */
  name: string;

  /**
   * Description or directive for the assistant to apply to all responses.
   */
  instructions?: string;

  /**
   * Metadata associated with the assistant.
   */
  metadata?: Record<string, string>;
}

/**
 * Response from updating an assistant.
 */
export interface UpdateAssistantResponse {
  /**
   * The name of the assistant that was updated.
   */
  assistantName?: string;
  /**
   * Description or directive for the assistant to apply to all responses.
   */
  instructions?: string;
  /**
   * Metadata associated with the assistant.
   */
  metadata?: object;
}

/**
 * Response from listing assistants.
 */
export interface AssistantList {
  /**
   * The list of assistants associated with a specific project.
   */
  assistants?: Array<AssistantModel>;
}

/**
 * The request for the alignment evaluation.
 *
 * @example
 * ```typescript
 * import type { EvaluateOptions } from '@pinecone-database/pinecone';
 * const options: EvaluateOptions = {
 *   question: 'Where can I start a return?',
 *   answer: 'From your order history.',
 *   groundTruth: 'Customers can start returns from their order history.',
 * };
 * ```
 */
export interface EvaluateOptions {
  /**
   * The question for which the answer was generated.
   */
  question: string;
  /**
   * The generated answer.
   */
  answer: string;
  /**
   * The ground truth answer to the question.
   */
  groundTruth: string;
}
