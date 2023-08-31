import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
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
  },
  { additionalProperties: false }
);

export type CreateIndexOptions = Static<typeof CreateIndexOptionsSchema>;

export const createIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CreateIndexOptionsSchema,
    'createIndex'
  );

  return async (options: CreateIndexOptions): Promise<void> => {
    validator(options);

    try {
      await api.createIndex({ createRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, options.name);
      throw err;
    }
  };
};
