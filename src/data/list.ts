import { buildConfigValidator } from '../validator';
import { Type } from '@sinclair/typebox';
import { DataOperationsProvider } from './dataOperationsProvider';
import type { ListRequest, ListResponse } from '../pinecone-generated-ts-fetch';

export type ListOptions = {
  prefix?: string;
  limit?: number;
  paginationToken?: string;
};

const ListOptionsSchema = Type.Object(
  {
    prefix: Type.Optional(Type.String({ minLength: 1 })),
    limit: Type.Optional(Type.Number()),
    paginationToken: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false }
);

export const listPaginated = (
  apiProvider: DataOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(ListOptionsSchema, 'listPaginated');

  return async (options?: ListOptions): Promise<ListResponse> => {
    if (options) {
      validator(options);
    }

    const listRequest: ListRequest = {
      ...options,
      namespace,
    };

    const api = await apiProvider.provide();
    return await api.list(listRequest);
  };
};
