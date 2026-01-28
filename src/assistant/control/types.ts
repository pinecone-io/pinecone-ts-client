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
 * Enum representing the possible statuses of an assistant.
 *
 * - `Initializing`: The assistant is initializing and is not yet ready to handle requests.
 * - `Failed`: The assistant encountered an error and cannot proceed.
 * - `Ready`: The assistant is ready to handle requests.
 * - `Terminating`: The assistant is shutting down and will soon be unavailable.
 */
export const AssistantStatusEnum = {
  Initializing: 'Initializing',
  Failed: 'Failed',
  Ready: 'Ready',
  Terminating: 'Terminating',
} as const;
export type AssistantStatusEnum =
  (typeof AssistantStatusEnum)[keyof typeof AssistantStatusEnum];

/**
 * Describes the configuration and status of a Pinecone Assistant.
 */
export interface AssistantModel {
  /**
   * The name of the assistant.
   */
  name: string;
  /**
   * The current status of the assistant. Can be one of 'Initializing', 'Failed', 'Ready', or 'Terminating'.
   */
  status: AssistantStatusEnum;
  /**
   * Description or directive for the assistant to apply to all responses.
   */
  instructions?: string | null;
  /**
   * Metadata associated with the assistant.
   */
  metadata?: object | null;
  /**
   * The host where the assistant is deployed.
   */
  host?: string;
  /**
   * The date and time the assistant was created.
   */
  createdAt?: Date;
  /**
   * The date and time the assistant was last updated.
   */
  updatedAt?: Date;
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
