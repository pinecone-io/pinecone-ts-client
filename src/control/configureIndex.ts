import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { PineconeArgumentError } from '../errors';
import { buildValidator } from '../validator';
import type { IndexName } from './types';
import { handleIndexRequestError } from './utils';

import { Static, Type } from '@sinclair/typebox';
import { ReplicasSchema, PodTypeSchema, IndexNameSchema } from './types';

const ConfigureIndexOptionsSchema = Type.Object(
  {
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
  },
  { additionalProperties: false }
);

export type ConfigureIndexOptions = Static<typeof ConfigureIndexOptionsSchema>;

export const configureIndex = (api: IndexOperationsApi) => {
  const indexNameValidator = buildValidator(
    'The first argument to configureIndex',
    IndexNameSchema
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

    if (Object.keys(options).length === 0) {
      throw new PineconeArgumentError(
        'The second argument to configureIndex should not be empty object. Please specify at least one property to update.'
      );
    }

    try {
      await api.configureIndex({ indexName: name, patchRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, name);
      throw err;
    }
  };
};
