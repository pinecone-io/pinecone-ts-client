import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import {
  mapHttpStatusError,
  PineconeConnectionError,
  extractMessage,
} from '../errors';
import { builOptionConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';

const idsArray = Type.Array(Type.String({ minLength: 1 }));
const deleteAll = Type.Boolean();
const filter = Type.Optional(Type.Object({}, { additionalProperties: true }));

const DeleteVectorOptionsSchema = Type.Object({
  ids: Type.Optional(idsArray),
  deleteAll: Type.Optional(deleteAll),
  filter: Type.Optional(filter),
});

export type DeleteVectorOptions = Static<typeof DeleteVectorOptionsSchema>;

export const deleteVector = (api: VectorOperationsApi, namespace: string) => {
  const validator = builOptionConfigValidator(
    DeleteVectorOptionsSchema,
    'deleteVector'
  );

  return async (options: DeleteVectorOptions): Promise<void> => {
    validator(options);

    try {
      await api._delete({ deleteRequest: { ...options, namespace } });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'FetchError') {
        throw new PineconeConnectionError(
          'Request failed to reach the server. Are you sure you are targeting an index that exists?'
        );
      } else {
        const deleteVectorError = e as ResponseError;
        const message = await extractMessage(deleteVectorError);

        throw mapHttpStatusError({
          status: deleteVectorError.response.status,
          url: deleteVectorError.response.url,
          message: message,
        });
      }
    }
  };
};
