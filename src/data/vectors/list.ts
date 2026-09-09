import { VectorOperationsProvider } from './vectorOperationsProvider';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import type {
  ListVectorsRequest,
  ListResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';

/**
 * Options for one page of record IDs from {@link Index.listPaginated}.
 *
 * @see [List record IDs](https://docs.pinecone.io/guides/data/list-record-ids)
 */
export type ListOptions = {
  /** The id prefix to match. If unspecified, an empty string prefix will be used with the effect of listing all ids in a namespace. */
  prefix?: string;
  /** Maximum IDs per page; omit for the service default. IDs are returned in sorted order. */
  limit?: number;
  /** A token needed to fetch the next page of results. This token is returned in the response if additional results are available. */
  paginationToken?: string;
  /** The namespace to list from. If not specified, uses the namespace configured on the Index. */
  namespace?: string;
};

export const listPaginated = (
  apiProvider: VectorOperationsProvider,
  targetNamespace: string,
) => {
  const validator = (options: ListOptions) => {
    // Don't need to check for empty string prefix or paginationToken, since empty strings evaluate to false
    if (options.limit && options.limit < 0) {
      throw new PineconeArgumentError(
        '`limit` property must be greater than 0',
      );
    }
  };

  return async (options?: ListOptions): Promise<ListResponse> => {
    if (options) {
      validator(options);
    }

    const namespace = options?.namespace ?? targetNamespace;
    const listRequest: ListVectorsRequest = {
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      ...options,
      namespace,
    };
    const api = await apiProvider.provide();
    return await api.listVectors(listRequest);
  };
};
