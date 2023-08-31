import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildValidator } from '../validator';
import type { IndexName } from './deleteIndex';
import { handleIndexRequestError } from './utils';

import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });
const positiveInteger = Type.Integer({ minimum: 1 });

const ConfigureIndexOptionsSchema = Type.Union([
  Type.Object(
    {
      replicas: positiveInteger,
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      podType: nonemptyString,
    },
    { additionalProperties: false }
  ),
]);

export type ConfigureIndexOptions = Static<typeof ConfigureIndexOptionsSchema>;

export const configureIndex = (api: IndexOperationsApi) => {
  const indexNameValidator = buildValidator(
    'The first argument to configureIndex',
    nonemptyString
  );
  const patchRequestValidator = buildValidator(
    'The second argument to configureIndex',
    ConfigureIndexOptionsSchema
  );

  return async (
    name: IndexName,
    options: ConfigureIndexOptions
  ): Promise<void> => {
    indexNameValidator(name);
    patchRequestValidator(options);

    try {
      await api.configureIndex({ indexName: name, patchRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, name);
      throw err;
    }
  };
};
