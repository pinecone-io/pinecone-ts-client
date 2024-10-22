import type { PineconeConfiguration } from '../data';
import { PineconeConfigurationError } from '../errors';
import { isNextJs } from './environment';

export const getFetch = (config: PineconeConfiguration) => {
  if (config.fetchApi) {
    // User-provided fetch implementation, if any, takes precedence.
    return config.fetchApi;
  } else if (global.fetch) {
    if (isNextJs()) {
      // NextJS ships with aggressive caching on fetch requests:
      // https://nextjs.org/docs/app/api-reference/functions/fetch
      // This can cause Pinecone responses to be stale, when users are in a NextJS environment.
      // So, when NextJS is detected, disable the cache:
      return async (input: RequestInfo, init?: RequestInit) => {
        const modifiedInit = {
          ...init,
          RequestCache: 'no-store',
        };
        return global.fetch(input, modifiedInit);
      };
    }
    // Else, simply return the global fetch implementation.
    return global.fetch;
  } else {
    // If no fetch implementation is found, throw an error.
    throw new PineconeConfigurationError(
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.'
    );
  }
};
