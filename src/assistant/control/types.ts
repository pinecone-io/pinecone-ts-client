import type { Assistant as AssistantModel } from '../../pinecone-generated-ts-fetch/assistant_control';

// Re-export the generated Assistant type as AssistantModel for consistency
export type { AssistantModel };

/**
 * The configuration needed to create an assistant.
 */
export interface CreateAssistantOptions {
  /**
   * The name of the assistant. Resource name must be 1-63 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
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
   * The region to deploy the assistant in. Our current options are either us or eu. Defaults to us.
   */
  region?: string;
}

/**
 * The configuration updates for the assistant.
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
