import { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';

/**
 * Options for targeting an index for data operations.
 *
 * You must provide either `name` or `host` (or both). If only `host` is provided, the SDK will
 * perform data operations directly against that host without calling {@link Indexes.describe} to resolve it.
 */
export interface IndexOptions {
  /**
   * The name of the index to target, such as `product-catalog`. Required unless `host` is provided.
   */
  name?: string;

  /**
   * The namespace to target within the index. If not specified, operations will be performed
   * on the default namespace.
   */
  namespace?: string;

  /**
   * The host URL to use for data operations against this index. If not provided,
   * the host URL will be automatically resolved by calling {@link Indexes.describe} using the `name`.
   *
   * You can find your index host in the Pinecone console or by using {@link Indexes.describe}.
   */
  host?: string;

  /**
   * Optional additional HTTP headers to include with each request to the index.
   *
   * These are merged over the `additionalHeaders` configured on the Pinecone client, so an
   * entry here wins on an exact key match and the client's other headers still apply.
   * Everything sent to this index is then headed by the merged set, applied after the
   * headers the SDK sets: an entry keyed exactly `X-Pinecone-Api-Version` pins these
   * requests to that API version. Matching is case-sensitive.
   *
   * The control-plane call that resolves an unknown host takes the client's headers, not
   * these, so pin at the client level to cover host resolution as well.
   */
  additionalHeaders?: HTTPHeaders;
}

/**
 * Options for targeting an assistant for operations.
 */
export interface AssistantOptions {
  /**
   * The name of the assistant to target, such as `support-handbook`.
   */
  name: string;

  /**
   * An optional host URL to use for operations against this assistant. If not provided,
   * the host URL will be automatically resolved by calling {@link Assistants.describe}.
   */
  host?: string;

  /**
   * Optional additional HTTP headers to include with each request to the assistant.
   *
   * These are merged over the `additionalHeaders` configured on the Pinecone client, so an
   * entry here wins on an exact key match and the client's other headers still apply.
   * Everything sent to this assistant is then headed by the merged set, applied after the
   * headers the SDK sets: an entry keyed exactly `X-Pinecone-Api-Version` pins these
   * requests to that API version. Matching is case-sensitive.
   */
  additionalHeaders?: HTTPHeaders;
}
