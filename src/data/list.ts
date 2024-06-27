import { buildConfigValidator } from '../validator';
import { Type } from '@sinclair/typebox';
import { DataOperationsProvider } from './dataOperationsProvider';
import type { ListRequest, ListResponse } from '../pinecone-generated-ts-fetch/data';

/**
 * See [List record IDs](https://docs.pinecone.io/guides/data/list-record-ids)
 */
export type ListOptions = {
  /** The id prefix to match. If unspecified, an empty string prefix will be used with the effect of listing all ids in a namespace. */
  prefix?: string;
  /** The maximum number of ids to return. If unspecified, the server will use a default value. */
  limit?: number;
  /** A token needed to fetch the next page of results. This token is returned in the response if additional results are available. */
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
