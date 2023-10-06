import {
  PineconeUnexpectedResponseError,
  mapHttpStatusError,
  PineconeConnectionError,
} from '../errors';
import type { PineconeConfiguration } from './types';
import { buildUserAgent, getFetch } from '../utils';

// We only ever want to call whoami a maximum of once per API key, even if there
// are multiple instantiations of the Index class. So we use a singleton here
// to cache projectIds by apiKey.
export const ProjectIdSingleton = (function () {
  const projectIds = {}; // map of apiKey to projectId

  const _fetchProjectId = async (
    options: PineconeConfiguration
  ): Promise<string> => {
    const { apiKey, environment } = options;
    const fetch = getFetch(options);
    const { url, request } = _buildWhoamiRequest(environment, apiKey);

    let response: Response;
    try {
      response = await fetch(url, request);
    } catch (e: any) {
      // Expected fetch exceptions listed here https://developer.mozilla.org/en-US/docs/Web/API/fetch#exceptions
      // Most are header-related and should never occur since we do not let the user set headers. A TypeError
      // will occur if the connection fails due to invalid environment configuration provided by the user. This is
      // different from server errors handled below because the client is unable to make contact with a Pinecone
      // server at all without a valid environment value.
      throw new PineconeConnectionError(e, url);
    }

    if (response.status >= 400) {
      throw mapHttpStatusError({
        status: response.status,
        url,
        message: await response.text(),
      });
    }

    let json;
    try {
      json = await response.json();
    } catch (e) {
      throw new PineconeUnexpectedResponseError(
        url,
        response.status,
        await response.text(),
        'The HTTP call succeeded but the response could not be parsed as JSON.'
      );
    }

    if (!json.project_name) {
      throw new PineconeUnexpectedResponseError(
        url,
        response.status,
        await response.text(),
        'The HTTP call succeeded but response did not contain expected project_name.'
      );
    }

    return json.project_name;
  };

  /** @hidden */
  const _buildWhoamiRequest = (
    environment: string,
    apiKey: string
  ): { url: string; request: RequestInit } => {
    const url = `https://controller.${environment}.pinecone.io/actions/whoami`;
    const request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'User-Agent': buildUserAgent(false),
      },
    };
    return { url, request };
  };

  const key = (config) => `${config.apiKey}:${config.environment}`;

  return {
    getProjectId: async function (config: PineconeConfiguration) {
      const cacheKey = key(config);
      if (cacheKey in projectIds) {
        return projectIds[cacheKey];
      } else {
        const projectId = await _fetchProjectId(config);
        projectIds[cacheKey] = projectId;
        return projectId;
      }
    },

    _reset: () => {
      for (const key of Object.keys(projectIds)) {
        delete projectIds[key];
      }
    },

    _set: (config, projectId) => {
      const cacheKey = key(config);
      projectIds[cacheKey] = projectId;
    },
  };
})();
