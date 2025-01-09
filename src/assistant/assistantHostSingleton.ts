import type { PineconeConfiguration } from '../data';
import { normalizeUrl } from '../utils';

export const AssistantHostSingleton = (function () {
  const hostUrls = {}; // map of apiKey-assistantName to hostUrl

  const getAssistantHostUrl = (region: string): string => {
    const regionHosts = {
      us: 'https://prod-1-data.ke.pinecone.io/assistant',
      eu: 'https://prod-eu-data.ke.pinecone.io/assistant',
    };
    return regionHosts[region];
  };

  const _key = (config: PineconeConfiguration, assistantName: string) =>
    `${config.apiKey}-${assistantName}`;

  // singleton object
  return {
    getHostUrl: (config: PineconeConfiguration, assistantName: string) => {
      const cacheKey = _key(config, assistantName);
      if (!hostUrls[cacheKey]) {
        const region = 'us'; // Default to region 'us' if not specified
        const hostUrl = getAssistantHostUrl(region);
        hostUrls[cacheKey] = normalizeUrl(hostUrl);
      }
      return hostUrls[cacheKey];
    },

    _reset: () => {
      for (const key of Object.keys(hostUrls)) {
        delete hostUrls[key];
      }
    },

    _set: (
      config: PineconeConfiguration,
      assistantName: string,
      region: string
    ) => {
      const hostUrl = getAssistantHostUrl(region);
      const normalizedHostUrl = normalizeUrl(hostUrl);
      if (!normalizedHostUrl) return;

      const cacheKey = _key(config, assistantName);
      hostUrls[cacheKey] = normalizedHostUrl;
    },

    _delete: (config: PineconeConfiguration, assistantName: string) => {
      const cacheKey = _key(config, assistantName);
      delete hostUrls[cacheKey];
    },
  };
})();
