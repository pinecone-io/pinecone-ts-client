import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { buildValidator } from '../validator';
import type { IndexName } from './deleteIndex';
import { validIndexMessage } from './utils';

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
      const configureIndexError = e as ResponseError;
      const message = await configureIndexError.response.text();

      const requestInfo = {
        status: configureIndexError.response.status,
        url: configureIndexError.response.url,
        message,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validIndexMessage(api, name, requestInfo);
        toThrow = mapHttpStatusError({ status: requestInfo.status, message });
      } else {
        // 500? 401? This logical branch is not generally expected. Let
        // the http error mapper handle it, but we can't write a
        // message because we don't know what went wrong.
        const requestInfo = {
          status: configureIndexError.response.status,
          url: configureIndexError.response.url,
          message,
        };
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
