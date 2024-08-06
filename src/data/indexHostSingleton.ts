import type { PineconeConfiguration } from './types';
import type { IndexName } from '../control';
import { describeIndex, indexOperationsBuilder } from '../control';
import { PineconeUnableToResolveHostError } from '../errors';
import { normalizeUrl } from '../utils';

// We use describeIndex to retrieve the data plane url (host) for a given API key
// and index. We only ever want to call describeIndex a maximum of once per API key
// and index, so we cache them in a singleton for reuse.
export const IndexHostSingleton = (function () {
  const hostUrls = {}; // map of apiKey-indexName to hostUrl

  const _describeIndex = async (
    config: PineconeConfiguration,
    indexName: IndexName
  ): Promise<string> => {
    const indexOperationsApi = indexOperationsBuilder(config);
    const describeResponse = await describeIndex(indexOperationsApi)(indexName);
    const host = describeResponse.host;

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

  const _key = (config: PineconeConfiguration, indexName: string) =>
    `${config.apiKey}-${indexName}`;

  const singleton = {
    getHostUrl: async (config: PineconeConfiguration, indexName: IndexName) => {
      const cacheKey = _key(config, indexName);
      if (cacheKey in hostUrls) {
        return hostUrls[cacheKey];
      } else {
        const hostUrl = await _describeIndex(config, indexName);
        singleton._set(config, indexName, hostUrl);

        if (!hostUrls[cacheKey]) {
          throw new PineconeUnableToResolveHostError(
            `Could not get host for index: ${indexName}. Call describeIndex('${indexName}') to check the current status.`
          );
        }
        return hostUrls[cacheKey];
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
      const normalizedHostUrl = normalizeUrl(hostUrl);
      // prevent adding an empty hostUrl to the cache
      if (!normalizedHostUrl) {
        return;
      }

      const cacheKey = _key(config, indexName);
      hostUrls[cacheKey] = normalizedHostUrl;
    },

    _delete: (config: PineconeConfiguration, indexName: IndexName) => {
      const cacheKey = _key(config, indexName);
      delete hostUrls[cacheKey];
    },
  };

  return singleton;
})();
