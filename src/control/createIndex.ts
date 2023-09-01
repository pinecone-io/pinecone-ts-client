import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import { debugLog } from '../utils';
import { handleApiError } from '../errors';
import { handleIndexRequestError } from './utils';
import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

const CreateIndexOptionsSchema = Type.Object(
  {
    name: nonemptyString,
    dimension: positiveInteger,
    metric: Type.Optional(nonemptyString),
    pods: Type.Optional(positiveInteger),
    replicas: Type.Optional(positiveInteger),
    podType: Type.Optional(nonemptyString),
    metadataConfig: Type.Optional(
      Type.Object(
        {
          indexed: Type.Array(nonemptyString),
        },
        { additionalProperties: false }
      )
    ),
    sourceCollection: Type.Optional(nonemptyString),
    waitUntilReady: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false }
);

export type CreateIndexOptions = Static<typeof CreateIndexOptionsSchema>;

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
