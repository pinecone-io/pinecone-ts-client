import {
  CreateIndexRequest,
  IndexModel,
  ManagePodIndexesApi,
} from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { debugLog } from '../utils';
import { handleApiError } from '../errors';
import { Type } from '@sinclair/typebox';
import {
  IndexNameSchema,
  CapacityModeSchema,
  CloudSchema,
  DimensionSchema,
  EnvironmentSchema,
  MetricSchema,
  PodsSchema,
  RegionSchema,
  ReplicasSchema,
  PodTypeSchema,
  MetadataConfigSchema,
  CollectionNameSchema,
} from './types';
import type { IndexName, PodType } from './types';

/**
 * @see [Understanding indexes](https://docs.pinecone.io/docs/indexes)
 */
export interface CreateIndexOptions extends CreateIndexRequest {
  /** This option tells the client not to resolve the returned promise until the index is ready to receive data. */
  waitUntilReady?: boolean;

  /** This option tells the client not to throw if you attempt to create an index that already exists. */
  suppressConflicts?: boolean;
}

const CreateIndexOptionsSchema = Type.Object(
  {
    name: IndexNameSchema,
    dimension: DimensionSchema,
    region: RegionSchema,
    cloud: CloudSchema,
    capacityMode: CapacityModeSchema,
    metric: Type.Optional(MetricSchema),
    pods: Type.Optional(PodsSchema),
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
    environment: Type.Optional(EnvironmentSchema),
    metadataConfig: Type.Optional(MetadataConfigSchema),
    sourceCollection: Type.Optional(CollectionNameSchema),
    waitUntilReady: Type.Optional(Type.Boolean()),
    suppressConflicts: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false }
);

export const createIndex = (api: ManagePodIndexesApi) => {
  const validator = buildConfigValidator(
    CreateIndexOptionsSchema,
    'createIndex'
  );

  return async (
    options: CreateIndexOptions
  ): Promise<IndexModel | undefined> => {
    // TODO: Fix runtime validation
    //validator(options);
    try {
      const createResponse = await api.createIndex({
        createIndexRequest: options,
      });
      if (options.waitUntilReady) {
        return await waitUntilIndexIsReady(api, options.name);
      }
      return createResponse;
    } catch (e) {
      if (
        !(
          options.suppressConflicts &&
          e instanceof Error &&
          e.name === 'PineconeConflictError'
        )
      ) {
        throw e;
      }
    }
  };
};

const waitUntilIndexIsReady = async (
  api: ManagePodIndexesApi,
  indexName: string,
  seconds: number = 0
): Promise<IndexModel> => {
  try {
    const indexDescription = await api.describeIndex({ indexName });
    if (!indexDescription.status?.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      return await waitUntilIndexIsReady(api, indexName, seconds + 1);
    } else {
      debugLog(`Index ${indexName} is ready after ${seconds}`);
      return indexDescription;
    }
  } catch (e) {
    const err = await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating index ${indexName}: ${rawMessageText}`
    );
    throw err;
  }
};
