import type { HTTPHeaders } from '../pinecone-generated-ts-fetch/db_data';

/**
 * Combines the headers configured on the client with headers configured for one index or
 * assistant. Per-target entries win on an exact key match.
 *
 * @param clientHeaders - `additionalHeaders` from the Pinecone client configuration.
 * @param targetHeaders - `additionalHeaders` from the index or assistant options.
 * @returns The merged headers, or `undefined` when neither side supplied any.
 */
export const mergeAdditionalHeaders = (
  clientHeaders?: HTTPHeaders,
  targetHeaders?: HTTPHeaders,
): HTTPHeaders | undefined => {
  if (!clientHeaders && !targetHeaders) {
    return undefined;
  }
  return { ...clientHeaders, ...targetHeaders };
};

/** Removes caller content types so each operation retains its body encoding. */
export const withoutContentType = (headers?: HTTPHeaders): HTTPHeaders =>
  Object.fromEntries(
    Object.entries(headers || {}).filter(
      ([name]) => name.toLowerCase() !== 'content-type',
    ),
  );
