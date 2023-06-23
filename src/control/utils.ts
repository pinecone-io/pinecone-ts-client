import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { FailedRequestInfo } from '../errors';
import { mapHttpStatusError } from '../errors';

export const validIndexMessage = async (
  api: IndexOperationsApi,
  name: string,
  requestInfo: FailedRequestInfo
) => {
  try {
    const validNames = await api.listIndexes();
    return `Index '${name}' does not exist. Valid index names: [${validNames
      .map((n) => `'${n}'`)
      .join(', ')}]`;
  } catch (e) {
    // Expect to end up here only if a second error occurs while fetching valid index names.
    // We can show the error from the failed call to describeIndex, but without listing
    // index names.
    throw mapHttpStatusError({
      ...requestInfo,
      message: `Index '${name}' does not exist.`,
    });
  }
};

export const validCollectionMessage = async (
  api: IndexOperationsApi,
  name: string,
  requestInfo: FailedRequestInfo
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
    throw mapHttpStatusError({
      ...requestInfo,
      message: `Collection '${name}' does not exist.`,
    });
  }
};
