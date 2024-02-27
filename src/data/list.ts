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

export const list = (
  apiProvider: DataOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(ListOptionsSchema, 'list');

  return async function* (
    options?: ListOptions
  ): AsyncGenerator<Array<string>, void, void> {
    let done = false;

    while (!done) {
      if (options) {
        validator(options);
      }

      const listRequest: ListRequest = {
        ...options,
        namespace,
      };

      const api = await apiProvider.provide();
      const results = await api.list(listRequest);

      if (results.vectors && results.vectors.length > 0) {
        const idResults = results.vectors.reduce((acc, result) => {
          if (result.id) {
            acc.push(result.id);
          }
          return acc;
        }, [] as Array<string>);
        yield new Promise<Array<string>>((resolve) => resolve(idResults));
      }

      if (results.pagination?.next) {
        options = {
          ...options,
          paginationToken: results.pagination.next,
        };
      } else {
        done = true;
      }
    }
  };
};
