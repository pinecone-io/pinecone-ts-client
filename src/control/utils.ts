import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

export const validIndexMessage = async (
  api: IndexOperationsApi,
  name: string
) => {
  try {
    const validNames = await api.listIndexes();
    return `Index '${name}' does not exist. Valid index names: [${validNames
      .map((n) => `'${n}'`)
      .join(', ')}]`;
  } catch (e) {
    // Expect to end up here only if a second error occurs while fetching valid index names.
    // In that case, we can just return a message without the additional context about what names
    // are valid.
    return `Index '${name}' does not exist.`;
  }
};

export const validCollectionMessage = async (
  api: IndexOperationsApi,
  name: string
) => {
  try {
    const validNames = await api.listCollections();
    return `Collection '${name}' does not exist. Valid collection names: [${validNames
      .map((n) => `'${n}'`)
      .join(', ')}]`;
  } catch (e) {
    // Expect to end up here only if a second error occurs while fetching valid collection names.
    // We can show the error from the failed call to describeIndex, but without listing
    // index names.
    return `Collection '${name}' does not exist.`;
  }
};

export const handleIndexRequestError = async (
  e: any,
  api: IndexOperationsApi,
  indexName: string
): Promise<Error> => {
  return await handleApiError(e, async (statusCode, rawMessageText) =>
    statusCode === 404
      ? await validIndexMessage(api, indexName)
      : rawMessageText
  );
};

export const handleCollectionRequestError = async (
  e: any,
  api: IndexOperationsApi,
  collectionName: string
): Promise<Error> => {
  return await handleApiError(e, async (statusCode, rawMessageText) =>
    statusCode === 404
      ? await validCollectionMessage(api, collectionName)
      : rawMessageText
  );
};
