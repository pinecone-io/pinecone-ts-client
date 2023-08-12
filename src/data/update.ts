import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import {
  mapHttpStatusError,
  PineconeConnectionError,
  extractMessage,
} from '../errors';
import { builOptionConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const SparseValues = Type.Object({
  indices: Type.Array(Type.Integer()),
  values: Type.Array(Type.Number()),
});

const UpdateVectorOptionsSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  values: Type.Optional(Type.Array(Type.Number())),
  sparseValues: Type.Optional(SparseValues),
  setMetadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
});

export type UpdateVectorOptions = Static<typeof UpdateVectorOptionsSchema>;

export const update = (api: VectorOperationsApi, namespace: string) => {
  const validator = builOptionConfigValidator(
    UpdateVectorOptionsSchema,
    'update'
  );

  return async (options: UpdateVectorOptions): Promise<void> => {
    validator(options);

    try {
      await api.update({ updateRequest: { ...options, namespace } });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'FetchError') {
        throw new PineconeConnectionError(
          'Request failed to reach the server. Are you sure you are targeting an index that exists?'
        );
      } else {
        const updateVectorError = e as ResponseError;
        const message = await extractMessage(updateVectorError);

        throw mapHttpStatusError({
          status: updateVectorError.response.status,
          url: updateVectorError.response.url,
          message: message,
        });
      }
    }
  };
};
