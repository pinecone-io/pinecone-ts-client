import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import { buildConfigValidator } from '../validator';
import type { IndexMeta } from '../pinecone-generated-ts-fetch';
import { IndexNameSchema } from './types';
import type { IndexName } from './types';
import type { PineconeConfiguration } from '../data/types';
import { DataUrlSingleton } from '../data/dataUrlSingleton';

/** The name of the index to describe */
export type DescribeIndexOptions = IndexName;
/** The description of your index returned from { @link Pinecone.describeIndex } */
export type IndexDescription = IndexMeta;

export const describeIndex = (
  api: IndexOperationsApi,
  clientConfig: PineconeConfiguration
) => {
  const validator = buildConfigValidator(IndexNameSchema, 'describeIndex');

  const removeDeprecatedFields = (result: any) => {
    if (result.database) {
      for (const key of Object.keys(result.database)) {
        if (result.database[key] === undefined) {
          delete result.database[key];
        }
      }
    }
  };

  return async (name: IndexName): Promise<IndexDescription> => {
    validator(name);

    const result = await api.describeIndex({ indexName: name });
    removeDeprecatedFields(result);
    if (result.status?.host) {
      DataUrlSingleton.setDataUrl(clientConfig, name, result.status.host);
    }
    return result;
  };
};
