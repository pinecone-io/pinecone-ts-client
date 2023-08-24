import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { buildConfigValidator } from '../validator';
import { validIndexMessage } from './utils';

import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });

const CreateCollectionOptionsSchema = Type.Object(
  {
    name: nonemptyString,
    source: nonemptyString,
  },
  { additionalProperties: false }
);

export type CreateCollectionOptions = Static<
  typeof CreateCollectionOptionsSchema
>;

export const createCollection = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(
    CreateCollectionOptionsSchema,
    'createCollection'
  );

  return async (options: CreateCollectionOptions): Promise<void> => {
    validator(options);

    try {
      await api.createCollection({ createCollectionRequest: options });
      return;
    } catch (e) {
      const createCollectionError = e as ResponseError;
      const message = await createCollectionError.response.text();
      const requestInfo = {
        status: createCollectionError.response.status,
        url: createCollectionError.response.url,
        message: message,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validIndexMessage(
          api,
          options.source,
          requestInfo
        );
        toThrow = mapHttpStatusError({ status: requestInfo.status, message });
      } else {
        // 500? 401? This logical branch is not generally expected. Let
        // the http error mapper handle it, but we can't write a
        // message because we don't know what went wrong.
        const requestInfo = {
          status: createCollectionError.response.status,
          url: createCollectionError.response.url,
          message,
        };
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
