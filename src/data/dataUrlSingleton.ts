import type { Pinecone } from '../pinecone';
import { PineconeConfiguration } from './types';

export const DataUrlSingleton = (function () {
  const dataUrlCache = {};

  const _fetchDataUrl = async (client, indexName: string) => {
    const description = await client.describeIndex(indexName);
    return 'https://' + description.status?.host;
  };

  const key = (apiKey, indexName) => `${apiKey}:${indexName}`;

  return {
    getDataUrl: async function (client: Pinecone, indexName: string) {
      const cacheKey = key(client.getConfig().apiKey, indexName);
      if (cacheKey in dataUrlCache) {
        return dataUrlCache[cacheKey];
      } else {
        const dataUrl = await _fetchDataUrl(client, indexName);
        dataUrlCache[cacheKey] = dataUrl;
        return dataUrl;
      }
    },

    setDataUrl: (
      config: PineconeConfiguration,
      indexName: string,
      dataUrl: string
    ) => {
      const cacheKey = key(config.apiKey, indexName);

      if (dataUrl.startsWith('https://')) {
        dataUrlCache[cacheKey] = dataUrl;
      } else {
        dataUrlCache[cacheKey] = 'https://' + dataUrl;
      }
    },

    _reset: () => {
      for (const key of Object.keys(dataUrlCache)) {
        delete dataUrlCache[key];
      }
    },
  };
})();
