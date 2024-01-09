import {
  ManagePodIndexesApi,
  IndexModel,
  ConfigureIndexRequestSpecPod,
} from '../pinecone-generated-ts-fetch';
import { PineconeArgumentError } from '../errors';
import { buildValidator } from '../validator';
import type { IndexName } from './types';

import { Type } from '@sinclair/typebox';
import { ReplicasSchema, PodTypeSchema, IndexNameSchema } from './types';

const ConfigureIndexOptionsSchema = Type.Object(
  {
    replicas: Type.Optional(ReplicasSchema),
    podType: Type.Optional(PodTypeSchema),
  },
  { additionalProperties: false }
);

export const configureIndex = (api: ManagePodIndexesApi) => {
  const indexNameValidator = buildValidator(
    'The first argument to configureIndex',
    IndexNameSchema
  );
  const patchRequestValidator = buildValidator(
    'The second argument to configureIndex',
    ConfigureIndexOptionsSchema
  );

  return async (
    indexName: IndexName,
    options: ConfigureIndexRequestSpecPod
  ): Promise<IndexModel> => {
    indexNameValidator(indexName);
    patchRequestValidator(options);

    if (Object.keys(options).length === 0) {
      throw new PineconeArgumentError(
        'The second argument to configureIndex should not be empty object. Please specify at least one property (replicas, podType) to update.'
      );
    }

    return await api.configureIndex({
      indexName,
      configureIndexRequest: { spec: { pod: options } },
    });
  };
};
