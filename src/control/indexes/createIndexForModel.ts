import type {
  ManageIndexesApi,
  CreateIndexForModelRequest,
  CreateIndexForModelRequestEmbed,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';

import type { IndexModel } from './listIndexes';
import type { ReadCapacity, DeletionProtection, IndexMetric } from '../types';

/**
 * The integrated embedding configuration for a new index.
 *
 * @see [Create an index with integrated embedding](https://docs.pinecone.io/guides/index-data/create-an-index#integrated-embedding)
 */
export interface CreateIndexForModelEmbed extends Omit<
  CreateIndexForModelRequestEmbed,
  'metric' | 'fieldMap'
> {
  /**
   * The name of the embedding model to use, for example
   * `multilingual-e5-large`. Call {@link Inference.listModels} to see the
   * models available to your project.
   */
  model: string;
  /**
   * Maps the model's input to a field of your documents. Pass
   * `{ text: 'chunk_text' }` to embed the `chunk_text` field of every document
   * you upsert.
   */
  fieldMap: Record<string, string>;
  /**
   * The distance metric to use for similarity search. Defaults to the model's
   * preferred metric.
   */
  metric?: IndexMetric;
}

/**
 * Options for creating an index with an integrated embedding model.
 *
 * The server builds a `semantic_text` schema field from the `embed` parameters
 * given here, so text you upsert is embedded for you. For full control over
 * schema composition — combining a dense or sparse vector field with full-text
 * search, for example — use {@link Indexes.create} directly.
 *
 * @see [Create an index with integrated embedding](https://docs.pinecone.io/guides/index-data/create-an-index#integrated-embedding)
 */
export interface CreateIndexForModelOptions extends Omit<
  CreateIndexForModelRequest,
  'name' | 'readCapacity' | 'deletionProtection' | 'embed'
> {
  /** The name of the index to create. Must be unique within the project. */
  name: string;
  /** The public cloud to host the index on: `aws`, `gcp`, or `azure`. */
  cloud: string;
  /** The cloud region to create the index in, for example `us-east-1`. */
  region: string;
  /** The embedding model and the document field it reads. */
  embed: CreateIndexForModelEmbed;
  /**
   * The read capacity configuration for the index. Omit for on-demand capacity.
   */
  readCapacity?: ReadCapacity;
  /** Whether to enable deletion protection. Defaults to `disabled`. */
  deletionProtection?: DeletionProtection;
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
   * When true, returns `undefined` instead of throwing if an index with this
   * name already exists. Otherwise creation always returns an index model,
   * regardless of `waitUntilReady`.
   */
  suppressConflicts?: boolean;
}

/**
 * Creates an index with an integrated embedding model.
 *
 * Integrated-embedding indexes are serverless only; pod and BYOC deployments
 * are not supported, and the deployment is chosen for you.
 *
 * @param api - The manage-indexes API client.
 * @param options - The {@link CreateIndexForModelOptions} for the index.
 */
export function createIndexForModel(
  api: ManageIndexesApi,
  options: CreateIndexForModelOptions & { suppressConflicts?: false },
): Promise<IndexModel>;
export function createIndexForModel(
  api: ManageIndexesApi,
  options: CreateIndexForModelOptions,
): Promise<IndexModel | void>;
export async function createIndexForModel(
  api: ManageIndexesApi,
  options: CreateIndexForModelOptions,
): Promise<IndexModel | void> {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`name`, `cloud`, `region`, `embed`) to create an index for a model.',
    );
  }
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.',
    );
  }
  if (!options.cloud) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `cloud` in order to create an index.',
    );
  }
  if (!options.region) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `region` in order to create an index.',
    );
  }
  if (!options.embed) {
    throw new PineconeArgumentError(
      'You must pass an `embed` object in order to create an index for a model.',
    );
  }
  if (!options.embed.model) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `embed.model` in order to create an index for a model.',
    );
  }
  if (
    !options.embed.fieldMap ||
    Object.keys(options.embed.fieldMap).length === 0
  ) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `embed.fieldMap` object in order to create an index for a model.',
    );
  }
  if (
    options.embed.metric &&
    !['cosine', 'euclidean', 'dotproduct'].includes(
      options.embed.metric.toLowerCase(),
    )
  ) {
    throw new PineconeArgumentError(
      `Invalid metric value: ${options.embed.metric}. Valid values are: cosine, euclidean, or dotproduct.`,
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
