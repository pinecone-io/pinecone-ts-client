import type { UsageModel } from '../../pinecone-generated-ts-fetch/assistant_data';

/**
 * The `ListFilesOptions` interface describes the options (a single filter) that can be passed to the `listFiles` method.
 */
export interface ListFilesOptions {
  /**
   * A filter object to filter the files returned by the `listFiles` method.
   */
  filter?: object;
}

// Properties for validation to ensure no unkonwn/invalid properties are passed.
type ListFilesOptionsType = keyof ListFilesOptions;
export const ListFilesOptionsType: ListFilesOptionsType[] = ['filter'];

/**
 * The `AssistantFilesList` interface describes the response for listing files uploaded to an assistant.
 */
export interface AssistantFilesList {
  files?: Array<AssistantFileModel>;
}

/**
 * Enum representing the possible statuses of an assistant file.
 *
 * - `Processing`: The file is currently being processed and is not yet available.
 * - `Available`: The file has been processed and is ready for use.
 * - `Deleting`: The file is in the process of being deleted.
 * - `ProcessingFailed`: There was an error encountered will processing.
 */
export const AssistantFileStatusEnum = {
  Processing: 'Processing',
  Available: 'Available',
  Deleting: 'Deleting',
  ProcessingFailed: 'ProcessingFailed',
} as const;
export type AssistantFileStatusEnum =
  (typeof AssistantFileStatusEnum)[keyof typeof AssistantFileStatusEnum];

/**
 * Represents a file associated with an assistant.
 */
export interface AssistantFileModel {
  /**
   * The name of the file.
   */
  name: string;
  /**
   * The unique identifier for the file.
   */
  id: string;
  /**
   * Optional metadata associated with the file.
   */
  metadata?: object | null;
  /**
   * The date and time the file was created.
   */
  createdOn?: Date;
  /**
   * The date and time the file was last updated.
   */
  updatedOn?: Date;
  /**
   * The current status of the file.
   */
  status?: AssistantFileStatusEnum;
  /**
   * The percentage of the file that has been processed
   */
  percentDone?: number | null;
  /**
   * A signed url that gives you access to the underlying file
   */
  signedUrl?: string | null;
  /**
   * A message describing any error during file processing, provided only if an error occurs.
   */
  errorMessage?: string | null;
}

/**
 * An enum representing the models that can be used for chatting with an assistant. The default is 'gpt-4o'.
 */
export const ChatModelEnum = {
  Gpt4o: 'gpt-4o',
  Claude35Sonnet: 'claude-3-5-sonnet',
} as const;
export type ChatModelEnum = (typeof ChatModelEnum)[keyof typeof ChatModelEnum];

/**
 * The `ChatOptions` interface describes the request format for sending a message to an Assistant.
 */
export interface ChatOptions {
  /**
   * The messages to send to the Assistant. Can be a list of strings or a list of objects. If sent as a list of
   * objects, must have exactly two keys: `role` and `content`. The `role` key can only be one of `user` or `assistant`.
   */
  messages: string[] | Array<{ [key: string]: string }>;
  /**
   * If false, the Assistant will return a single JSON response. If true, the Assistant will return a stream of responses.
   */
  stream?: boolean;
  /**
   * The large language model to use for answer generation. Must be one of the models defined in {@link ChatModelEnum}.
   * If empty, the assistant will default to using 'gpt-4o' model.
   */
  model?: string;
  /**
   * A filter against which documents can be retrieved.
   */
  filter?: object;
}

// Properties for validation to ensure no unkonwn/invalid properties are passed.
type ChatOptionsType = keyof ChatOptions;
export const ChatOptionsType: ChatOptionsType[] = [
  'messages',
  'stream',
  'model',
  'filter',
];

/**
 * The `ContextOptions` interface describes the query and optional filter to retrieve context snippets from an Assistant.
 */
export interface ContextOptions {
  /**
   * The query to retrieve context snippets for.
   */
  query: string;
  /**
   * Optional filter to apply to the context snippets.
   */
  filter?: Record<string, string>;
}

type ContextOptionsType = keyof ContextOptions;
export const ContextOptionsType: ContextOptionsType[] = ['query', 'filter'];

/**
 * The `UploadFileOptions` interface describes the file path for uploading a file to an Assistant and optional metadata.
 */
export interface UploadFileOptions {
  /**
   * The (local) path to the file to upload.
   */
  path: string;
  /**
   * Optional metadata to attach to the file.
   */
  metadata?: Record<string, string>;
}

// Properties for validation to ensure no unkonwn/invalid properties are passed.
type UploadFileOptionsType = keyof UploadFileOptions;
export const UploadFileOptionsType: UploadFileOptionsType[] = [
  'path',
  'metadata',
];

export type StreamedChatResponse =
  | MessageStartChunk
  | ContentChunk
  | CitationChunk
  | MessageEndChunk;

interface BaseChunk {
  type: string;
  id: string;
  model: string;
}

export interface MessageStartChunk extends BaseChunk {
  type: 'message_start';
  role: string;
}

export interface ContentChunk extends BaseChunk {
  type: 'content_chunk';
  delta: {
    content: string;
  };
}

export interface CitationChunk extends BaseChunk {
  type: 'citation';
  citation: {
    position: number;
    references: Array<{
      file: AssistantFileModel;
      pages: number[];
    }>;
  };
}

export interface MessageEndChunk extends BaseChunk {
  type: 'message_end';
  finishReason: string;
  usage: UsageModel;
}

export interface StreamedChatCompletionsResponse {
  id: string;
  choices: ChoiceModel[];
  model: string;
}

export interface ChoiceModel {
  finishReason?: FinishReasonEnum;
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
}

export const FinishReasonEnum = {
  Stop: 'stop',
  Length: 'length',
  ContentFilter: 'content_filter',
  FunctionCall: 'function_call',
} as const;
export type FinishReasonEnum =
  (typeof FinishReasonEnum)[keyof typeof FinishReasonEnum];
