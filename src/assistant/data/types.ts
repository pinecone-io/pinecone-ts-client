import type {
  AssistantFileModel,
  UsageModel,
  ContentFilterResults,
  HighlightModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';

/**
 * Options for filtering files in the list operation.
 *
 * @example
 * ```typescript
 * import type { ListFilesOptions } from '@pinecone-database/pinecone';
 * const options: ListFilesOptions = { filter: { category: { $eq: 'returns' } } };
 * ```
 */
export interface ListFilesOptions {
  /**
   * Filter by file metadata, such as `{ category: { $eq: 'returns' } }`.
   * Reference metadata fields at the top level, without a `metadata` wrapper.
   *
   * @see {@link https://docs.pinecone.io/guides/data/filter-with-metadata Metadata filters}
   */
  filter?: object;
}

/**
 * Response for listing files uploaded to an assistant.
 */
export interface AssistantFilesList {
  /**
   * The list of files associated with the assistant.
   */
  files?: Array<AssistantFileModel>;
}

/**
 * Options for listing the async operations (such as file uploads and deletes)
 * performed on an assistant.
 *
 * @example
 * ```typescript
 * import type { ListOperationsOptions } from '@pinecone-database/pinecone';
 * const options: ListOperationsOptions = { status: 'Processing' };
 * ```
 */
export interface ListOperationsOptions {
  /**
   * Optionally filter operations by type, such as the kind of action the
   * operation represents (e.g. uploading or deleting a file).
   */
  operationType?: string;
  /**
   * Optionally filter operations by status (e.g. `Processing`, `Completed`, or
   * `Failed`).
   */
  status?: string;
  /**
   * The maximum number of operations to return.
   */
  limit?: number;
  /**
   * The token to paginate through the list of operations. Use the
   * `pagination.next` returned in a previous response to fetch the next page.
   */
  paginationToken?: string;
}

/**
 * Convenience names for assistant chat models.
 *
 * This enum is provided for convenience but is not enforced. You can pass any string value
 * as the model parameter. Use a supported model name even if it is not listed here.
 * @see [Choose a model](https://docs.pinecone.io/guides/assistant/chat-with-assistant#choose-a-model)
 */
export const ChatModelEnum = {
  /** OpenAI GPT-4o. */
  Gpt4o: 'gpt-4o',
  /** OpenAI GPT-4.1. */
  Gpt41: 'gpt-4.1',
  /** OpenAI o4-mini. */
  O4Mini: 'o4-mini',
  /** Anthropic Claude Sonnet 4.5. */
  ClaudeSonnet45: 'claude-sonnet-4-5',
  /** Google Gemini 2.5 Pro. */
  Gemini25Pro: 'gemini-2.5-pro',
};

/**
 * This enum type is provided for convenience but is not enforced. You can pass any string value
 * as the model parameter. Use a supported model name even if it is not listed here.
 * @see [Choose a model](https://docs.pinecone.io/guides/assistant/chat-with-assistant#choose-a-model)
 */
export type ChatModelEnum = (typeof ChatModelEnum)[keyof typeof ChatModelEnum];

/**
 * Describes the format of a message in an assistant chat. The `role` key can only be one of `user` or `assistant`.
 *
 * @example
 * ```typescript
 * import type { MessageModel } from '@pinecone-database/pinecone';
 * const message: MessageModel = { role: 'user', content: 'How do I return an order?' };
 * ```
 */
export interface MessageModel {
  /** Author of the message: user or assistant. */
  role: string;
  /** The message text. */
  content: string;
}

/**
 * The messages to send to an assistant. Can be a list of strings or a list of {@link MessageModel} objects.
 * Strings are sent as user messages; use objects to include assistant replies in the conversation.
 *
 * @example
 * ```typescript
 * import type { MessagesModel } from '@pinecone-database/pinecone';
 * const messages: MessagesModel = [
 *   { role: 'user', content: 'How do I return an order?' },
 * ];
 * ```
 */
export type MessagesModel = string[] | MessageModel[];

/**
 * Controls the context snippets used to generate an answer.
 *
 * @example
 * ```typescript
 * import type { ChatContextOptions } from '@pinecone-database/pinecone';
 * const options: ChatContextOptions = { multimodal: true, includeBinaryContent: true };
 * ```
 */
export interface ChatContextOptions {
  /**
   * The maximum number of context snippets to use; omit to use the service default.
   */
  topK?: number;
  /**
   * The maximum size of each context snippet, in tokens; omit to use the service default.
   */
  snippetSize?: number;
  /**
   * Whether or not to send image-related context snippets to the LLM. If `false`, only text context snippets are sent.
   */
  multimodal?: boolean;
  /**
   * If image-related context snippets are sent to the LLM, this field determines whether or not they should include base64 image data. If `false`, only the image caption is sent. Only available when `multimodal=true`.
   */
  includeBinaryContent?: boolean;
}

/**
 * Messages and response settings for {@link Assistant.chat} and {@link Assistant.chatStream}.
 *
 * @example
 * ```typescript
 * import type { ChatOptions } from '@pinecone-database/pinecone';
 * const options: ChatOptions = { messages: ['How do I return an order?'] };
 * ```
 */
export interface ChatOptions {
  /**
   * The {@link MessagesModel} to send to the Assistant. Can be a list of strings or a list of objects. If sent as a list of
   * objects, must have exactly two keys: `role` and `content`. The `role` key can only be one of `user` or `assistant`.
   */
  messages: MessagesModel;
  /**
   * The large language model to use for answer generation
   */
  model?: string;
  /**
   * Controls response variability where supported by the model. Lower values favor more consistent answers.
   */
  temperature?: number;

  /**
   * Filter the files used for retrieval by metadata, such as `{ category: 'returns' }`.
   */
  filter?: object;
  /**
   * Request a JSON answer with {@link Assistant.chat}; unavailable for streaming.
   */
  jsonResponse?: boolean;
  /**
   * Request highlighted passages from the source files that support the answer.
   */
  includeHighlights?: boolean;
  /**
   * Controls the context snippets used to generate an answer.
   */
  contextOptions?: ChatContextOptions;
}

/**
 * Request format for sending a chat completion request to an assistant.
 *
 * @example
 * ```typescript
 * import type { ChatCompletionOptions } from '@pinecone-database/pinecone';
 * const options: ChatCompletionOptions = { messages: ['How do I return an order?'] };
 * ```
 */
export interface ChatCompletionOptions {
  /**
   * The {@link MessagesModel} to send to the Assistant. Can be a list of strings or a list of objects. If sent as a list of
   * objects, must have exactly two keys: `role` and `content`. The `role` key can only be one of `user` or `assistant`.
   */
  messages: MessagesModel;
  /**
   * The large language model to use for answer generation
   */
  model?: string;
  /**
   * Controls response variability where supported by the model. Lower values favor more consistent answers.
   */
  temperature?: number;
  /**
   * Filter the files used for retrieval by metadata, such as `{ category: 'returns' }`.
   */
  filter?: object;
}

/**
 * Parameters to retrieve context from an assistant.
 *
 * @example
 * ```typescript
 * import type { ContextOptions } from '@pinecone-database/pinecone';
 * const options: ContextOptions = { query: 'How do I return an order?' };
 * ```
 */
export interface ContextOptions {
  /**
   * The query that is used to generate the context. Exactly one of query or messages should be provided.
   */
  query?: string;
  /**
   * The list of messages to use for generating the context. Exactly one of query or messages should be provided.
   */
  messages?: MessagesModel;
  /**
   * Filter the files used for retrieval by metadata, such as `{ category: 'returns' }`.
   */
  filter?: object;
  /**
   * The maximum number of context snippets to return; omit to use the service default.
   */
  topK?: number;
  /**
   * The maximum size of each context snippet, in tokens; omit to use the service default.
   */
  snippetSize?: number;
  /**
   * Whether or not to retrieve image-related context snippets. If `false`, only text snippets are returned.
   */
  multimodal?: boolean;
  /**
   * If image-related context snippets are returned, this field determines whether or not they should include base64 image data. If `false`, only the image captions are returned. Only available when `multimodal=true`.
   */
  includeBinaryContent?: boolean;
}

/**
 * An uploadable file value. Can be a Node.js `Buffer`, a `Blob`, or a Node.js
 * `ReadableStream`. Pass a `ReadableStream` to avoid loading the file into
 * memory — for example, when forwarding an incoming HTTP upload directly to
 * the assistant without buffering on disk.
 *
 * `Blob` works in browser-compatible runtimes. `Buffer` requires Buffer support;
 * Node.js readable streams require a Node.js runtime.
 *
 * Note: `ReadableStream` inputs are sent in a single attempt. Automatic
 * retries are not supported because the stream is consumed after the first
 * read and cannot be replayed.
 */
export type Uploadable = Buffer | Blob | NodeJS.ReadableStream;

/**
 * Options for uploading a file to an assistant.
 *
 * Provide either `path` (a local file path) or `file` + `fileName` (an
 * in-memory buffer, blob, or readable stream). The two forms are mutually
 * exclusive.
 *
 * @example
 * ```typescript
 * import type { UploadFileOptions } from '@pinecone-database/pinecone';
 * const options: UploadFileOptions = {
 *   file: new Blob(['Start a return from your order history.']),
 *   fileName: 'returns-policy.txt',
 * };
 * ```
 */
export type UploadFileOptions = {
  /**
   * Metadata to attach to the file.
   */
  metadata?: Record<string, string | number>;
  /**
   * Enable image extraction when processing the file.
   */
  multimodal?: boolean;
} & (
  | {
      /**
       * The local path to the file to upload. The file is read asynchronously.
       * Requires a Node.js runtime; use `file` on Edge or Workers runtimes.
       */
      path: string;
      /** Unavailable when using the alternative file input. */
      file?: never;
      /** Unavailable when using the alternative file input. */
      fileName?: never;
    }
  | {
      /**
       * The file data to upload. Accepts a `Buffer`, `Blob`, or Node.js
       * `ReadableStream`. Provide `fileName` for all file inputs.
       */
      file: Uploadable;
      /**
       * The filename shown for the uploaded file, such as `returns-policy.pdf`.
       * Required when using `file`.
       */
      fileName: string;
      /** Unavailable when using the alternative file input. */
      path?: never;
    }
);

/**
 * Options for creating or replacing a file on an assistant at a caller-supplied
 * file ID.
 *
 * Provide the `assistantFileId` to create or replace, along with either `path`
 * (a local file path) or `file` + `fileName` (an in-memory buffer, blob, or
 * readable stream). The two content forms are mutually exclusive.
 *
 * Unlike {@link UploadFileOptions} — which always creates a new file with a
 * server-generated ID — upsert is keyed on the ID you supply and does not
 * accept metadata.
 *
 * @example
 * ```typescript
 * import type { UpsertFileOptions } from '@pinecone-database/pinecone';
 * const options: UpsertFileOptions = {
 *   assistantFileId: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
 *   path: 'returns-policy.pdf',
 * };
 * ```
 */
export type UpsertFileOptions = {
  /**
   * The ID of the file to create or replace. If a file with this ID already
   * exists, its content is replaced; otherwise a new file is created with this
   * identifier.
   */
  assistantFileId: string;
  /**
   * Enable image extraction when processing the file.
   */
  multimodal?: boolean;
} & (
  | {
      /**
       * The local path to the file to upload. The file is read asynchronously.
       * Requires a Node.js runtime; use `file` on Edge or Workers runtimes.
       */
      path: string;
      /** Unavailable when using the alternative file input. */
      file?: never;
      /** Unavailable when using the alternative file input. */
      fileName?: never;
    }
  | {
      /**
       * The file data to upload. Accepts a `Buffer`, `Blob`, or Node.js
       * `ReadableStream`. Provide `fileName` for all file inputs.
       */
      file: Uploadable;
      /**
       * The filename shown for the uploaded file, such as `returns-policy.pdf`.
       * Required when using `file`.
       */
      fileName: string;
      /** Unavailable when using the alternative file input. */
      path?: never;
    }
);

/**
 * Indicates why the chat response generation stopped. This signals the end of the response.
 *
 * - `stop`: The model finished generating the response.
 *
 * - `length`: Generation was cut off because the maximum number of tokens allowed was reached.
 *
 * - `content_filter`: Generation stopped because content was blocked by content filtering rules
 *   (for example, content that contains hate speech or violent material).
 *
 * - `tool_calls`: Generation stopped because a tool call was triggered.
 *
 * - `function_call`: Generation stopped because a function call was triggered.
 *
 * This enum is provided for convenience but is not enforced.
 */
export const FinishReasonEnum = {
  /** Generation reached a natural stopping point. */
  Stop: 'stop',
  /** Generation reached the token limit. */
  Length: 'length',
  /** Generation stopped because of content filtering. */
  ContentFilter: 'content_filter',
  /** Generation requested a tool call. */
  ToolCalls: 'tool_calls',
  /** Generation requested a function call. */
  FunctionCall: 'function_call',
} as const;
/**
 * This type is provided for convenience but is not enforced.
 */
export type FinishReasonEnum =
  (typeof FinishReasonEnum)[keyof typeof FinishReasonEnum];

/**
 * A discriminated union representing a chunked response in a streamed chat.
 * This can be one of several chunk types: {@link MessageStartChunk}, {@link ContentChunk}, {@link CitationChunk}, or {@link MessageEndChunk}.
 * These represent the objects that will be streamed as a part of the assistant's response.
 */
export type StreamedChatResponse =
  MessageStartChunk | ContentChunk | CitationChunk | MessageEndChunk;

/**
 * Describes the common properties of all the chunk types streamed in a chat response.
 * The different chunk types form a discriminated union type {@link StreamedChatResponse}.
 */
export interface BaseChunk {
  /**
   * The type of chunk. Either `message_start`, `content_chunk`, `citation`, or `message_end`.
   */
  type: string;
  /**
   * The unique identifier for the streaming response.
   */
  id: string;
  /**
   * The model used to generate the response.
   */
  model: string;
}

/**
 * Describes the start of a streamed message in a chat response.
 */
export interface MessageStartChunk extends BaseChunk {
  /**
   * The type of the chunk indicating the beginning of the stream.
   */
  type: 'message_start';
  /** The role of the message sender. */
  role: string;
  /**
   * The number of context snippets used to generate the response.
   */
  contextSnippetCount?: number;
  /**
   * The results of any content filtering applied to the response.
   */
  contentFilterResults?: ContentFilterResults;
}

/**
 * Describes a chunk containing a piece of message content.
 */
export interface ContentChunk extends BaseChunk {
  /**
   * The type of the chunk indicating content.
   */
  type: 'content_chunk';
  /**
   * The content delta, representing a portion of the message content.
   */
  delta: {
    /** Text carried by this message or streamed chunk. */
    content: string;
  };
  /**
   * The results of any content filtering applied to the response.
   */
  contentFilterResults?: ContentFilterResults;
}

/**
 * Describes a chunk containing citation information for a message.
 */
export interface CitationChunk extends BaseChunk {
  /**
   * The type of the chunk indicating a citation.
   */
  type: 'citation';
  /**
   * The citation details, including the position and references.
   */
  citation: {
    /**
     * The position of the citation within the message content.
     */
    position: number;
    /**
     * An array of references associated with the citation.
     */
    references: Array<{
      /**
       * The {@link AssistantFileModel} associated with the citation.
       */
      file?: AssistantFileModel;
      /**
       * The pages in the file that are referenced.
       */
      pages?: number[];
      /**
       * The highlighted excerpt within the referenced file, if available.
       */
      highlight?: HighlightModel | null;
    }>;
  };
}

/**
 * Describes the end of a streamed message in a chat response.
 */
export interface MessageEndChunk extends BaseChunk {
  /**
   * The type of the chunk indicating the end of the stream.
   */
  type: 'message_end';
  /**
   * The reason why the message generation finished.
   */
  finishReason: string;
  /**
   * The usage details associated with the streamed response.
   */
  usage?: UsageModel;
  /**
   * The results of any content filtering applied to the response.
   */
  contentFilterResults?: ContentFilterResults;
}

/**
 * Describes a streamed response for chat completion request. Each response chunk will have the
 * same shape.
 */
export interface StreamedChatCompletionResponse {
  /**
   * The unique identifier for the streaming response.
   */
  id: string;
  /**
   * An array of {@link ChoiceModel} representing different response types.
   */
  choices: ChoiceModel[];
  /**
   * The model used to generate the response.
   */
  model: string;
}

/**
 * Describes a single choice in a streamed chat response.
 */
export interface ChoiceModel {
  /**
   * The reason why the response generation finished, if applicable.
   */
  finishReason?: string;
  /**
   * The index of the choice in the response.
   */
  index: number;
  /**
   * The delta object containing role and content updates for the choice.
   */
  delta: {
    /**
     * The role of the message sender.
     */
    role?: string;
    /**
     * The content of the message.
     */
    content?: string;
  };
}
