import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError, PineconeConnectionError } from '../errors';
import { builOptionConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';

const nonemptyString = Type.String({ minLength: 1 });

const SparseValues = Type.Object({
    indices: Type.Array(Type.Integer()),
    values: Type.Array(Type.Number()),
});

const Vector = Type.Object({
    id: nonemptyString,
    values: Type.Array(Type.Number()),
    sparseValues: Type.Optional(SparseValues),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true }))
});

const VectorArray = Type.Array(Vector);

export type Vector = Static<typeof Vector>;
export type SparseValues = Static<typeof SparseValues>;

export type VectorArray = Static<typeof VectorArray>;

export const upsert = (api: VectorOperationsApi, namespace: string) => {
  const validator = builOptionConfigValidator(
    VectorArray,
    'upsert'
  );

  return async (vectors: VectorArray): Promise<void> => {
    validator(vectors);

    try {
      await api.upsert({ upsertRequest: { vectors, namespace } }); 
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'FetchError') {
        throw new PineconeConnectionError('Request failed to reach the server. Are you sure you are targeting an index that exists?')
      } else {
        const upsertError = e as ResponseError;
        let message = await upsertError.response.text();
        
        // Error response of this endpoint seems different from others,
        // so we will try to parse out the actual message text, but 
        // we wrap it in a try to avoid crashing in a way that obscures
        // the actual error if the response format changes in the future.
        try {
          const messageJSON = JSON.parse(message);
          if (messageJSON.message) {
            message = messageJSON.message;
          }
        } catch (e) {
          // noop
        }

        throw mapHttpStatusError({
          status: upsertError.response.status,
          url: upsertError.response.url,
          message: message,
        });  
      }
    }
  };
};
