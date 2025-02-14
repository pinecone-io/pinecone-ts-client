import type { PineconeConfiguration } from '../data';
import { normalizeUrl } from '../utils';
import { asstControlOperationsBuilder } from './control/asstControlOperationsBuilder';
import { describeAssistant } from './control';

export const AssistantHostSingleton = (function () {
  const hostUrls = {}; // map of apiKey-assistantName to hostUrl

  function ensureAssistantPath(url) {
    if (!url.endsWith('/assistant')) {
      // Append "/assistant" if it doesn't already end with it
      url = url.endsWith('/') ? `${url}assistant` : `${url}/assistant`;
    }
    return url;
  }

  const _describeAssistant = async (
    config: PineconeConfiguration,
    assistantName: string
  ): Promise<string> => {
    const assistantControlApi = asstControlOperationsBuilder(config);
    const describeResponse = await describeAssistant(assistantControlApi)(
      assistantName
    );
    const host = describeResponse?.host;

    if (!host) {
      // if the host is empty for some reason, default based on region
      let defaultHost = 'https://prod-1-data.ke.pinecone.io';
      // If 'eu' is specified use that, otherwise default to 'us'
      if (
        config.assistantRegion &&
        config.assistantRegion.toLowerCase() === 'eu'
      ) {
        defaultHost = 'https://prod-eu-data.ke.pinecone.io';
      }
      return defaultHost;
    } else {
      return host;
    }
  };

  const _key = (config: PineconeConfiguration, assistantName: string) =>
    `${config.apiKey}-${assistantName}`;

  // singleton object
  const singleton = {
    getHostUrl: async (
      config: PineconeConfiguration,
      assistantName: string
    ) => {
      const cacheKey = _key(config, assistantName);
      if (cacheKey in hostUrls) {
        return hostUrls[cacheKey];
      } else {
        const hostUrl = await _describeAssistant(config, assistantName);
        hostUrls[cacheKey] = normalizeUrl(ensureAssistantPath(hostUrl));
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
      hostUrl: string
    ) => {
      const normalizedHostUrl = normalizeUrl(ensureAssistantPath(hostUrl));
      // prevent adding an empty hostUrl to the cache
      if (!hostUrl || !normalizedHostUrl) {
        return;
      }

      const cacheKey = _key(config, assistantName);
      hostUrls[cacheKey] = normalizedHostUrl;
    },

    _delete: (config: PineconeConfiguration, assistantName: string) => {
      const cacheKey = _key(config, assistantName);
      delete hostUrls[cacheKey];
    },
  };

  return singleton;
})();
