import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { builOptionConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });

const CreateCollectionOptionsSchema = Type.Object({
  name: nonemptyString,
  source: nonemptyString
});

export type CreateCollectionOptions = Static<typeof CreateCollectionOptionsSchema>;

export const createCollection = (api: IndexOperationsApi) => {
  const validator = builOptionConfigValidator(
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
      throw mapHttpStatusError({
        status: createCollectionError.response.status,
        url: createCollectionError.response.url,
        message: message,
      });
    }
  };
};
