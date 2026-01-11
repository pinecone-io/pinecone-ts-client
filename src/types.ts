import { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';

/**
 * Options for targeting an index for data operations.
 */
export interface IndexOptions {
  /**
   * The name of the index to target.
   */
  name: string;

  /**
   * The namespace to target within the index. If not specified, operations will be performed
   * on the default namespace `''`.
   */
  namespace?: string;

  /**
   * An optional host URL to use for data operations against this index. If not provided,
   * the host URL will be automatically resolved by calling `describeIndex()`.
   */
  host?: string;

  /**
   * Optional additional HTTP headers to include with each request to the index.
   */
  additionalHeaders?: HTTPHeaders;
}

/**
 * Options for targeting an assistant for operations.
 */
export interface AssistantOptions {
  /**
   * The name of the assistant to target.
   */
  name: string;

  /**
   * An optional host URL to use for operations against this assistant. If not provided,
   * the host URL will be automatically resolved by calling `describeAssistant()`.
   */
  host?: string;

  /**
   * Optional additional HTTP headers to include with each request to the assistant.
   */
  additionalHeaders?: HTTPHeaders;
}
