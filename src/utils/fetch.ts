import type { PineconeConfiguration } from '../data';
import { PineconeConfigurationError } from '../errors';

export const getFetch = (config: PineconeConfiguration) => {
  if (config.fetchApi) {
    // User-provided fetch implementation, if any, takes precedence.
    return config.fetchApi;
  } else if (global.fetch) {
    // If a fetch implementation is present in the global scope (will work with native fetch in Node18+, Edge runtimes,
    // etc.), use that. This should prevent confusing failures in
    // Next.js projects where @vercel/fetch is mandated and
    // other implementations are stubbed out.
    return global.fetch;
  } else {
    // If no fetch implementation is found, throw an error.
    throw new PineconeConfigurationError(
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.'
    );
  }
};
