import {
  ResponseError,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import type { PineconeConfiguration } from '../../data';
import { buildUserAgent, getFetch, ChatStream } from '../../utils';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import type { ChatOptions, StreamedChatCompletionsResponse } from './types';
import { handleApiError } from '../../errors';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import {
  messagesValidation,
  modelValidation,
  validateChatOptions,
} from './chat';

export const chatCompletionsStream = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration
) => {
  return async (
    options: ChatOptions
  ): Promise<ChatStream<StreamedChatCompletionsResponse>> => {
    const fetch = getFetch(config);
    validateChatOptions(options);

    const hostUrl = await apiProvider.provideHostUrl();
    const chatUrl = `${hostUrl}/chat/${assistantName}/chat/completions`;

    const requestHeaders = {
      'Api-Key': config.apiKey,
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
    };

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        messages: messagesValidation(options),
        stream: true,
        model: modelValidation(options),
        filter: options.filter,
      }),
    });

    if (response.ok && response.body) {
      const nodeReadable = Readable.fromWeb(response.body as ReadableStream);
      return new ChatStream<StreamedChatCompletionsResponse>(nodeReadable);
    } else {
      const err = await handleApiError(
        new ResponseError(response, 'Response returned an error'),
        undefined,
        chatUrl
      );
      throw err;
    }
  };
};
