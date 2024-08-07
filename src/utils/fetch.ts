import crossFetch from 'cross-fetch';
import { fetch as undiciFetch } from 'undici';
import type { PineconeConfiguration } from '../data';
import { Response as UndiciResponse } from 'undici';
import { RequestInit as UndiciRequestInit } from 'undici';



// export type CustomFetch = WindowOrWorkerGlobalScope['fetch'] | typeof undiciFetch;
// export type CustomFetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export type CustomFetch = (input: RequestInfo | URL, init?: UnifiedRequestInit | undefined) => Promise<UnifiedResponse>;
export type FetchAPI2 = CustomFetch | WindowOrWorkerGlobalScope['fetch'] | typeof undiciFetch;

// Unified response type
export type UnifiedResponse = Response | UndiciResponse;
export type UnifiedRequestInit = RequestInit & UndiciRequestInit;


export const getFetch = (config: PineconeConfiguration) => {
  if (config.fetchApi) {
    // User-provided fetch implementation, if any, takes precedence.
    return config.fetchApi as FetchAPI2;
  } else if (globalThis.fetch) {
    // If a fetch implementation is already present in the global
    // scope, use that. This should prevent confusing failures in
    // nextjs projects where @vercel/fetch is mandated and
    // other implementations are stubbed out.
    // return global.fetch;
    return globalThis.fetch as FetchAPI2;
  } else {
    // Use ponyfill as last resort
    return crossFetch as FetchAPI2;
  }
};
