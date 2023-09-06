import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildValidator } from '../validator';
import type { IndexName } from './types';
import { handleIndexRequestError } from './utils';

import { Static, Type } from '@sinclair/typebox';
import { ReplicasSchema, PodTypeSchema, IndexNameSchema } from './types';

const ConfigureIndexOptionsSchema = Type.Union([
  Type.Object({ replicas: ReplicasSchema }, { additionalProperties: false }),
  Type.Object({ podType: PodTypeSchema }, { additionalProperties: false }),
]);

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

    try {
      await api.configureIndex({ indexName: name, patchRequest: options });
      return;
    } catch (e) {
      const err = await handleIndexRequestError(e, api, name);
      throw err;
    }
  };
};
