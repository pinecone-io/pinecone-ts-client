import { X_PINECONE_API_VERSION } from '../pinecone-generated-ts-fetch/db_control';

export const withControlApiVersion = <
  T extends { xPineconeApiVersion: string }
>(
  params: Omit<T, 'xPineconeApiVersion'>
): T =>
  ({
    ...(params as object),
    xPineconeApiVersion: X_PINECONE_API_VERSION,
  } as T);
