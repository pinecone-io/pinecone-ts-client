import { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';

/**
 * Options for targeting an index for data operations.
 *
 * You must provide either `name` or `host` (or both). If only `host` is provided, the SDK will
 * perform data operations directly against that host without calling `describeIndex()` to resolve it.
 */
export interface IndexOptions {
  /**
   * The name of the index to target. Required unless `host` is provided.
   */
  name?: string;

  /**
   * The namespace to target within the index. If not specified, operations will be performed
   * on the default namespace `''`.
   */
  namespace?: string;

  /**
   * The host URL to use for data operations against this index. If not provided,
   * the host URL will be automatically resolved by calling `describeIndex()` using the `name`.
   *
   * You can find your index host in the Pinecone console or by using `describeIndex()`.
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
