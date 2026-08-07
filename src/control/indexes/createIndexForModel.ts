import type {
  ManageIndexesApi,
  CreateIndexForModelRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';

import type { ReadCapacity } from '../types';

export type { ManagedDeployment } from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Options for creating an index with an integrated embedding model.
 *
 * This is a convenience wrapper around {@link Indexes.create}: the server builds a
 * `semantic_text` schema field named `field` from the model parameters provided
 * here. For full control over schema composition — for example combining semantic
 * text with additional metadata fields — use {@link Indexes.create} directly.
 *
 * @see [Create an index with integrated embedding](https://docs.pinecone.io/guides/index-data/create-an-index#integrated-embedding)
 */
export interface CreateIndexForModelOptions extends Omit<
  CreateIndexForModelRequest,
  'name' | 'readCapacity'
> {
  /** The name of the index to create. Must be unique within the project. */
  name: string;
  /**
   * The read capacity configuration for the index. Omit for on-demand capacity.
   */
  readCapacity?: ReadCapacity;
  /**
   * When true, polls until the index is ready before returning.
   */
  waitUntilReady?: boolean;
  /**
   * Maximum time in milliseconds to wait for the index to become ready when
   * `waitUntilReady` is `true`. Omit to poll indefinitely.
   * Throws {@link Errors.PineconeTimeoutError} if the deadline is exceeded.
   */
  timeout?: number;
  /**
   * When true, does not throw if an index with this name already exists.
   */
  suppressConflicts?: boolean;
}

/**
 * Creates an index with an integrated embedding model.
 *
 * Integrated-embedding indexes are serverless only; pod and BYOC deployments are
 * not supported. Omit `deployment` to default to managed (serverless).
 *
 * @param api - The manage-indexes API client.
 * @param options - The {@link CreateIndexForModelOptions} for the index.
 */
export async function createIndexForModel(
  api: ManageIndexesApi,
  options: CreateIndexForModelOptions,
): Promise<IndexModel | void> {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`name`, `field`, `model`) to create an index for a model.',
    );
  }
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.',
    );
  }
  if (!options.field) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `field` in order to create an index for a model.',
    );
  }
  if (!options.model) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `model` in order to create an index for a model.',
    );
  }
  if (
    options.metric &&
    !['cosine', 'euclidean', 'dotproduct'].includes(
      options.metric.toLowerCase(),
    )
  ) {
    throw new PineconeArgumentError(
      `Invalid metric value: ${options.metric}. Valid values are: cosine, euclidean, or dotproduct.`,
    );
  }

  const { waitUntilReady, timeout, suppressConflicts, ...createRequest } =
    options;

  try {
    const result = await api.createIndexForModel({
      createIndexForModelRequest: createRequest,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    if (waitUntilReady) {
      return await pollUntilIndexIsReady(
        async () => {
          try {
            return await api.describeIndex({
              indexName: result.name,
              xPineconeApiVersion: X_PINECONE_API_VERSION,
            });
          } catch (e) {
            throw await handleApiError(
              e,
              async (_, rawMessageText) =>
                `Error waiting for index ${result.name} to be ready: ${rawMessageText}`,
            );
          }
        },
        result.name,
        timeout,
      );
    }
    return result;
  } catch (e) {
    if (
      suppressConflicts &&
      e instanceof Error &&
      e.name === 'PineconeConflictError'
    ) {
      return;
    }
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating index for model ${options.name}: ${rawMessageText}`,
    );
  }
}
