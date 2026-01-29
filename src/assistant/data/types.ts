import type {
  AssistantFileModel,
  UsageModel,
} from '../../pinecone-generated-ts-fetch/assistant_data';

/**
 * Options for filtering files in the list operation.
 */
export interface ListFilesOptions {
  /**
   * Optionally filter which files can be retrieved using the following metadata fields.
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
 * An enum representing the models that can be used for chatting with an assistant. The default is 'gpt-4o'.
 */
export const ChatModelEnum = {
  Gpt4o: 'gpt-4o',
  Gpt41: 'gpt-4.1',
  O4Mini: 'o4-mini',
  Claude35Sonnet: 'claude-3-5-sonnet',
  Claude37Sonnet: 'claude-3-7-sonnet',
  Gemini25Pro: 'gemini-2.5-pro',
} as const;
export type ChatModelEnum = (typeof ChatModelEnum)[keyof typeof ChatModelEnum];

/**
 * Describes the format of a message in an assistant chat. The `role` key can only be one of `user` or `assistant`.
 */
export interface MessageModel {
  role: string;
  content: string;
}

/**
 * The messages to send to an assistant. Can be a list of strings or a list of {@link MessageModel} objects.
 * The `role` key can only be one of `user` or `assistant`.
 */
export type MessagesModel = string[] | MessageModel[];

/**
 * Controls the context snippets sent to the LLM.
 */
export interface ChatContextOptions {
  /**
   * The maximum number of context snippets to use. Default is 16. Maximum is 64.
   */
  topK?: number;
  /**
   * The maximum context snippet size. Default is 2048 tokens. Minimum is 512 tokens. Maximum is 8192 tokens.
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
 * The list of queries / chats to chat an assistant
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
   * Controls the randomness of the model's output: lower values make responses more deterministic, while higher values increase creativity and variability. If the model does not support a temperature parameter, the parameter will be ignored.
   */
  temperature?: number;

  /**
   * Optionally filter which documents can be retrieved using the following metadata fields.
   */
  filter?: object;
  /**
   * If true, the assistant will be instructed to return a JSON response. Cannot be used with streaming.
   */
  jsonResponse?: boolean;
  /**
   * If true, the assistant will be instructed to return highlights from the referenced documents that support its response.
   */
  includeHighlights?: boolean;
  /**
   * Controls the context snippets sent to the LLM.
   */
  contextOptions?: ChatContextOptions;
}

/**
 * Request format for sending a chat completion request to an assistant.
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
   * Controls the randomness of the model's output: lower values make responses more deterministic, while higher values increase creativity and variability. If the model does not support a temperature parameter, the parameter will be ignored.
   */
  temperature?: number;
  /**
   * Optionally filter which documents can be retrieved using the following metadata fields.
   */
  filter?: object;
}

/**
 * Parameters to retrieve context from an assistant.
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
   * Optionally filter which documents can be retrieved using the following metadata fields.
   */
  filter?: object;
  /**
   * The maximum number of context snippets to return. Default is 16. Maximum is 64.
   */
  topK?: number;
  /**
   * The maximum context snippet size. Default is 2048 tokens. Minimum is 512 tokens. Maximum is 8192 tokens.
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
 * Options for uploading a file to an assistant.
 */
export interface UploadFileOptions {
  /**
   * The (local) path to the file to upload.
   */
  path: string;
  /**
   * Metadata to attach to the file.
   */
  metadata?: Record<string, string | number>;
  /**
   * Whether to process the file as multimodal (enabling image extraction). Defaults to false.
   */
  multimodal?: boolean;
}

/**
 * Enum representing the reasons why a response generation may finish.
 *
 * - `Stop`: The response was completed normally.
 * - `Length`: The response was truncated due to length constraints.
 * - `ContentFilter`: The response was stopped by a content filter.
 * - `FunctionCall`: The response generation was interrupted by a function call.
 */
export const FinishReasonEnum = {
  Stop: 'stop',
  Length: 'length',
  ContentFilter: 'content_filter',
  FunctionCall: 'function_call',
} as const;
export type FinishReasonEnum =
  (typeof FinishReasonEnum)[keyof typeof FinishReasonEnum];

/**
 * A discriminated union representing a chunked response in a streamed chat.
 * This can be one of several chunk types: {@link MessageStartChunk}, {@link ContentChunk}, {@link CitationChunk}, or {@link MessageEndChunk}.
 * These represent the objects that will be streamed as a part of the assistant't response.
 */
export type StreamedChatResponse =
  | MessageStartChunk
  | ContentChunk
  | CitationChunk
  | MessageEndChunk;

/**
 * Describes the common properties of all the chunk types streamed in a chat response.
 * The different chunk types form a a discriminated union type {@link StreamedChatResponse}.
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
  /**
   * The role of the message sender. Either `user` or `assistant`.
   */
  role: string;
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
    content: string;
  };
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
      file: AssistantFileModel;
      /**
       * The pages in the file that are referenced.
       */
      pages: number[];
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
  finishReason: FinishReasonEnum;
  /**
   * The usage details associated with the streamed response.
   */
  usage: UsageModel;
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
  finishReason?: FinishReasonEnum;
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
