import {
  ResponseError,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import type { PineconeConfiguration } from '../../data';
import { buildUserAgent, getFetch, ChatStream } from '../../utils';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ChatOptions, StreamedChatResponse } from './types';
import { handleApiError } from '../../errors';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import {
  messagesValidation,
  modelValidation,
  validateChatOptions,
} from './chat';

export const chatStream = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration,
) => {
  return async (
    options: ChatOptions,
  ): Promise<ChatStream<StreamedChatResponse>> => {
    const fetch = getFetch(config);
    validateChatOptions(options);

    const hostUrl = await apiProvider.provideHostUrl();
    const chatUrl = `${hostUrl}/chat/${assistantName}`;

    const requestHeaders = {
      'Api-Key': config.apiKey,
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
    };

    // format context options
    let contextOptions: object | void = undefined;
    if (
      options.contextOptions?.topK ||
      options.contextOptions?.snippetSize ||
      options.contextOptions?.multimodal !== undefined ||
      options.contextOptions?.includeBinaryContent !== undefined
    ) {
      contextOptions = {
        top_k: options.contextOptions?.topK || options.topK,
        snippet_size: options.contextOptions?.snippetSize,
        multimodal: options.contextOptions?.multimodal,
        include_binary_content: options.contextOptions?.includeBinaryContent,
      };
    } else if (options.topK) {
      contextOptions = {
        top_k: options.topK,
      };
    }

    // Note: This operation uses direct fetch() for streaming support.
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        messages: messagesValidation(options),
        stream: true,
        model: modelValidation(options),
        filter: options.filter,
        json_response: options.jsonResponse,
        include_highlights: options.includeHighlights,
        context_options: contextOptions,
      }),
    });

    if (response.ok && response.body) {
      const nodeReadable = Readable.fromWeb(response.body as ReadableStream);
      return new ChatStream<StreamedChatResponse>(nodeReadable);
    } else {
      const err = await handleApiError(
        new ResponseError(response, 'Response returned an error'),
        undefined,
        chatUrl,
      );
      throw err;
    }
  };
};
