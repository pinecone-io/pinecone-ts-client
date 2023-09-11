import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { debugLog } from '../utils';
import { handleApiError } from '../errors';
import { handleIndexRequestError } from './utils';
import { Type } from '@sinclair/typebox';
import {
  IndexNameSchema,
  DimensionSchema,
  MetricSchema,
  PodsSchema,
  ReplicasSchema,
  PodTypeSchema,
  MetadataConfigSchema,
  CollectionNameSchema,
} from './types';

export type CreateIndexOptions = {
  name: string;
  dimension: number;
  metric?: string;
  pods?: number;
  replicas?: number;
  podType?: string;
  metadataConfig?: { indexed: Array<string> };
  sourceCollection?: string;
  waitUntilReady?: boolean;
};

const CreateIndexOptionsSchema = Type.Object(
  {
    name: IndexNameSchema,
    dimension: DimensionSchema,
    metric: Type.Optional(MetricSchema),
    pods: Type.Optional(PodsSchema),
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
    metadataConfig: Type.Optional(MetadataConfigSchema),
    sourceCollection: Type.Optional(CollectionNameSchema),
    waitUntilReady: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false }
);

export const createIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CreateIndexOptionsSchema,
    'createIndex'
  );

  return async (options: CreateIndexOptions): Promise<string | void> => {
    validator(options);

    try {
      await api.createIndex({ createRequest: options });
      if (options.waitUntilReady) {
        return await waitUntilIndexIsReady(api, options.name);
      }
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, options.name);
      throw err;
    }
  };
};

const waitUntilIndexIsReady = async (
  api: IndexOperationsApi,
  indexName: string,
  seconds: number = 0
) => {
  try {
    const indexDescription = await api.describeIndex({ indexName });
    if (!indexDescription.status?.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      return await waitUntilIndexIsReady(api, indexName, seconds + 1);
    } else {
      debugLog(`Index ${indexName} is ready after ${seconds}`);
      return;
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
