import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { builOptionConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

const CreateIndexOptionsSchema = Type.Object({
  name: nonemptyString,
  dimension: positiveInteger,
  metric: Type.Optional(nonemptyString),
  pods: Type.Optional(positiveInteger),
  replicas: Type.Optional(positiveInteger),
  podType: Type.Optional(nonemptyString),
  metadataConfig: Type.Optional(Type.Object({})),
  sourceCollection: Type.Optional(nonemptyString),
});

export type CreateIndexOptions = Static<typeof CreateIndexOptionsSchema>;

export const createIndex = (api: IndexOperationsApi) => {
  const validator = builOptionConfigValidator(
    CreateIndexOptionsSchema,
    'createIndex'
  );

  return async (options: CreateIndexOptions): Promise<void> => {
    validator(options);

    try {
      await api.createIndex({ createRequest: options });
      return;
    } catch (e) {
      const createIndexError = e as ResponseError;
      const message = await createIndexError.response.text();
      throw mapHttpStatusError({
        status: createIndexError.response.status,
        url: createIndexError.response.url,
        message: message,
      });
    }
  };
};
