import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { PineconeConfiguration } from './types';
import type { IndexName } from '../control';
import { describeIndex, indexOperationsBuilder } from '../control';
import { PineconeUnableToResolveHostError } from '../errors';

// We use describeIndex to retrieve the data plane url (host) for a given API key
// and index. We only ever want to call describeIndex a maximum of once per API key
// and index, so we cache them in a singleton for reuse.
export const IndexHostSingleton = (function () {
  const hostUrls = {}; // map of apiKey-indexName to hostUrl
  let indexOperationsApi: InstanceType<typeof IndexOperationsApi> | null = null;

  const _describeIndex = async (
    config: PineconeConfiguration,
    indexName: IndexName
  ): Promise<string> => {
    if (!indexOperationsApi) {
      indexOperationsApi = indexOperationsBuilder(config);
    }

    const describeResponse = await describeIndex(indexOperationsApi)(indexName);
    const host = describeResponse.status?.host;

    if (!host) {
      // Generally, middleware will handle most errors from the call itself such as index not found, etc
      // However, we need to explicitly handle the optionality of status.host
      throw new PineconeUnableToResolveHostError(
        'The HTTP call succeeded but the host URL could not be resolved. Please make sure the index exists and is in a ready state.'
      );
    } else {
      return host;
    }
  };

  const key = (config, indexName) => `${config.apiKey}-${indexName}`;

  // describeIndex returns host without the protocol, prepend on return from cache
  const hostWithProtocol = (host) => `https://${host}`;

  return {
    getHostUrl: async function (
      config: PineconeConfiguration,
      indexName: IndexName
    ) {
      const cacheKey = key(config, indexName);
      if (cacheKey in hostUrls) {
        return hostWithProtocol(hostUrls[cacheKey]);
      } else {
        const hostUrl = await _describeIndex(config, indexName);
        hostUrls[cacheKey] = hostUrl;
        return hostWithProtocol(hostUrl);
      }
    },

    _reset: () => {
      for (const key of Object.keys(hostUrls)) {
        delete hostUrls[key];
      }
    },

    _set: (
      config: PineconeConfiguration,
      indexName: IndexName,
      hostUrl: string
    ) => {
      // prevent adding an empty hostUrl to the cache
      if (hostUrl === '') {
        throw new PineconeUnableToResolveHostError(
          'An invalid host URL was encountered. Please make sure the index exists and is in a ready state.'
        );
      }

      const cacheKey = key(config, indexName);
      hostUrls[cacheKey] = hostUrl;
    },

    _delete: (config: PineconeConfiguration, indexName: IndexName) => {
      const cacheKey = key(config, indexName);
      delete hostUrls[cacheKey];
    },
  };
})();
