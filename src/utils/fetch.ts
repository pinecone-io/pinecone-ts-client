import crossFetch from 'cross-fetch';
import type { PineconeConfiguration } from '../data';

export const getFetch = (config: PineconeConfiguration) => {
  if (config.fetchApi) {
    // User-provided fetch implementation, if any, takes precedence.
    return config.fetchApi;
  } else if (global.fetch) {
    // If a fetch implementation is already present in the global
    // scope, use that. This should prevent confusing failures in
    // nextjs projects where @vercel/fetch is mandated and
    // other implementations are stubbed out.
    return global.fetch;
  } else {
    // Use ponyfill as last resort
    return crossFetch;
  }
};
