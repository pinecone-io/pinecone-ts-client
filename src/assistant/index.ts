import { chat } from './data/chat';
import type {
  ChatCompletionOptions,
  ChatOptions,
  ContextOptions,
  ListFilesOptions,
  ListOperationsOptions,
  UploadFileOptions,
  UpsertFileOptions,
} from './data/types';
import { chatCompletion } from './data/chatCompletion';
import { chatStream } from './data/chatStream';
import { chatCompletionStream } from './data/chatCompletionStream';
import { listFiles } from './data/listFiles';
import { describeFile } from './data/describeFile';
import { deleteFile } from './data/deleteFile';
import { uploadFile } from './data/uploadFile';
import { upsertFile } from './data/upsertFile';
import { describeOperation } from './data/describeOperation';
import { listOperations } from './data/listOperations';
import { PineconeConfiguration } from '../data';
import { AsstDataOperationsProvider } from './data/asstDataOperationsProvider';
import { context } from './data/context';
import { AssistantOptions } from '../types';
import { PineconeArgumentError } from '../errors';

// Export input option types
export type {
  CreateAssistantOptions,
  UpdateAssistantOptions,
  UpdateAssistantResponse,
  AssistantList,
  AssistantModel,
  EvaluateOptions,
} from './control/types';

// Export input option types for data operations
export type {
  ChatOptions,
  ChatContextOptions,
  ChatCompletionOptions,
  ContextOptions,
  ListFilesOptions,
  ListOperationsOptions,
  UploadFileOptions,
  UpsertFileOptions,
  Uploadable,
  AssistantFilesList,
  MessagesModel,
  MessageModel,
  ChatModelEnum,
  StreamedChatResponse,
  StreamedChatCompletionResponse,
  BaseChunk,
  MessageStartChunk,
  ContentChunk,
  CitationChunk,
  MessageEndChunk,
  ChoiceModel,
  FinishReasonEnum,
} from './data/types';

// Export generated data response types
export type {
  AssistantFileModel,
  ChatModel,
  ChatCompletionModel,
  ContextModel,
  UsageModel,
  CitationModel,
  SnippetModel,
  TextSnippetModel,
  MultiModalSnippetModel,
  ReferenceModel,
  HighlightModel,
  OperationModel,
  OperationList,
  PaginationResponse,
} from '../pinecone-generated-ts-fetch/assistant_data';

export { ChatStream } from './chatStream';

/**
 * An assistant answers questions using the files you provide.
 *
 * Access it through {@link Pinecone.assistant}; do not construct it directly.
 * Use {@link Assistants} through `pc.assistants` to create and manage assistants.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const assistant = pc.assistant({ name: 'support-guide' });
 * ```
 */
export class Assistant {
  private config: PineconeConfiguration;

  /** @internal */
  readonly _chat: ReturnType<typeof chat>;
  /** @internal */
  readonly _chatStream: ReturnType<typeof chatStream>;
  /** @internal */
  readonly _chatCompletion: ReturnType<typeof chatCompletion>;
  /** @internal */
  readonly _chatCompletionStream: ReturnType<typeof chatCompletionStream>;
  /** @internal */
  readonly _listFiles: ReturnType<typeof listFiles>;
  /** @internal */
  readonly _describeFile: ReturnType<typeof describeFile>;
  /** @internal */
  readonly _uploadFile: ReturnType<typeof uploadFile>;
  /** @internal */
  readonly _upsertFile: ReturnType<typeof upsertFile>;
  /** @internal */
  readonly _deleteFile: ReturnType<typeof deleteFile>;
  /** @internal */
  readonly _describeOperation: ReturnType<typeof describeOperation>;
  /** @internal */
  readonly _listOperations: ReturnType<typeof listOperations>;
  /** @internal */
  readonly _context: ReturnType<typeof context>;

  /** The name of the assistant targeted by this client. */
  assistantName: string;

  /** @internal */
  constructor(options: AssistantOptions, config: PineconeConfiguration) {
    if (!options.name || options.name.trim() === '') {
      throw new PineconeArgumentError(
        'Assistant name is required and cannot be empty.',
      );
    }

    this.config = config;
    const asstDataOperationsProvider = new AsstDataOperationsProvider(
      this.config,
      options.name,
      options.host,
      options.additionalHeaders,
    );
    this.assistantName = options.name;

    this._chat = chat(this.assistantName, asstDataOperationsProvider);
    this._chatStream = chatStream(
      this.assistantName,
      asstDataOperationsProvider,
      this.config,
    );
    this._chatCompletion = chatCompletion(
      this.assistantName,
      asstDataOperationsProvider,
    );
    this._chatCompletionStream = chatCompletionStream(
      this.assistantName,
      asstDataOperationsProvider,
      this.config,
    );
    this._listFiles = listFiles(this.assistantName, asstDataOperationsProvider);
    this._describeFile = describeFile(
      this.assistantName,
      asstDataOperationsProvider,
    );
    this._uploadFile = uploadFile(
      this.assistantName,
      asstDataOperationsProvider,
      this.config,
    );
    this._upsertFile = upsertFile(
      this.assistantName,
      asstDataOperationsProvider,
      this.config,
    );
    this._deleteFile = deleteFile(
      this.assistantName,
      asstDataOperationsProvider,
    );
    this._describeOperation = describeOperation(
      this.assistantName,
      asstDataOperationsProvider,
    );
    this._listOperations = listOperations(
      this.assistantName,
      asstDataOperationsProvider,
    );
    this._context = context(this.assistantName, asstDataOperationsProvider);
  }

  // --------- Chat methods ---------

  /**
   * Generates an answer from the assistant with structured citations.
   *
   * Server errors are retried according to {@link PineconeConfiguration.maxRetries}.
   *
   * @param options - Messages and optional model, file filter, and response settings.
   * @returns The answer in `message`, with citations and token usage.
   * @throws {@link Errors.PineconeArgumentError} if the messages or model fail validation.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const response = await assistant.chat({
   *   messages: [{ role: 'user', content: 'How do I return an order?' }],
   * });
   * console.log(response.message, response.citations);
   * ```
   *
   * @see {@link Assistant.chatStream} for streamed answers; {@link Assistant.chatCompletion} for completion-style responses.
   */
  chat(options: ChatOptions) {
    return this._chat(options);
  }

  /**
   * Streams an assistant answer and its structured citations.
   *
   * Requires a Node.js runtime. Server errors are retried according to
   * {@link PineconeConfiguration.maxRetries} before streaming begins.
   *
   * @param options - Messages and optional model, file filter, and context settings.
   * @returns An async iterable of message, content, citation, and completion chunks.
   * @throws {@link Errors.PineconeArgumentError} if the messages or model fail validation.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const stream = await assistant.chatStream({
   *   messages: [{ role: 'user', content: 'How do I return an order?' }],
   * });
   * for await (const chunk of stream) {
   *   if (chunk.type === 'content_chunk') console.log(chunk.delta.content);
   * }
   * ```
   *
   * @see {@link Assistant.chat} for a complete answer; {@link Assistant.chatCompletionStream} for completion-style chunks.
   */
  chatStream(options: ChatOptions) {
    return this._chatStream(options);
  }

  /**
   * Generates an assistant answer in a chat completion response format.
   *
   * Server errors are retried according to {@link PineconeConfiguration.maxRetries}.
   *
   * @param options - Messages and optional model, temperature, and file metadata filter.
   * @returns Response choices containing the answer, with model and token usage.
   * @throws {@link Errors.PineconeArgumentError} if the messages or model fail validation.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const response = await assistant.chatCompletion({
   *   messages: [{ role: 'user', content: 'How do I return an order?' }],
   * });
   * console.log(response.choices);
   * ```
   *
   * @see {@link Assistant.chat} for structured citations and additional response options.
   */
  chatCompletion(options: ChatCompletionOptions) {
    return this._chatCompletion(options);
  }

  /**
   * Streams an assistant answer in a chat completion response format.
   *
   * Requires a Node.js runtime. Server errors are retried according to
   * {@link PineconeConfiguration.maxRetries} before streaming begins.
   *
   * @param options - Messages and optional model, temperature, and file metadata filter.
   * @returns An async iterable of completion chunks; each choice contains incremental updates in `delta`.
   * @throws {@link Errors.PineconeArgumentError} if the messages or model fail validation.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const stream = await assistant.chatCompletionStream({
   *   messages: [{ role: 'user', content: 'How do I return an order?' }],
   * });
   * for await (const chunk of stream) {
   *   for (const choice of chunk.choices) {
   *     if (choice.delta.content) console.log(choice.delta.content);
   *   }
   * }
   * ```
   *
   * @see {@link Assistant.chatCompletion} for a complete response; {@link Assistant.chatStream} for structured citation chunks.
   */
  chatCompletionStream(options: ChatCompletionOptions) {
    return this._chatCompletionStream(options);
  }

  // --------- File methods ---------

  /**
   * Lists files uploaded to the assistant.
   *
   * @param options - Optional file metadata filter; omit to list files without filtering.
   * @returns File details in `files`, including processing status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const result = await assistant.listFiles({
   *   filter: { category: { $eq: 'returns' } },
   * });
   * console.log(result.files);
   * ```
   *
   * @see {@link Assistant.describeFile} for details of one file.
   */
  listFiles(options?: ListFilesOptions) {
    if (!options) {
      options = {};
    }
    return this._listFiles(options);
  }

  /**
   * Gets file details and processing status.
   *
   * @param fileId - The file ID returned by an upload operation or file listing.
   * @param includeUrl - Include a signed download URL; defaults to `true`.
   * @returns File details, including status and a download URL when requested.
   * @throws {@link Errors.PineconeArgumentError} if `fileId` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const file = await assistant.describeFile('1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b');
   * console.log(file.status);
   * ```
   *
   * @see {@link Assistant.listFiles} to find file IDs.
   */
  describeFile(fileId: string, includeUrl: boolean = true) {
    return this._describeFile(fileId, includeUrl);
  }

  /**
   * Uploads a new file for the assistant to use.
   *
   * Processing continues asynchronously; check the returned operation with
   * {@link Assistant.describeOperation}. Stream inputs are sent in a single attempt.
   *
   * @param options - A local `path`, or `file` plus `fileName`, with optional metadata and multimodal processing.
   * @returns An operation whose `id` tracks processing and whose `fileId` identifies the file.
   * @throws {@link Errors.PineconeArgumentError} if file input or its required filename is missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const operation = await assistant.uploadFile({
   *   path: 'returns-policy.pdf',
   *   metadata: { category: 'returns' },
   * });
   * console.log(operation.id);
   * ```
   *
   * @see {@link Assistant.upsertFile} to create or replace a file at an ID you supply.
   */
  uploadFile(options: UploadFileOptions) {
    return this._uploadFile(options);
  }

  /**
   * Creates or replaces a file at an ID you supply.
   *
   * Processing continues asynchronously; check the returned operation with
   * {@link Assistant.describeOperation}. Stream inputs are sent in a single attempt.
   *
   * @param options - The `assistantFileId` and a local `path`, or `file` plus `fileName`, with optional multimodal processing.
   * @returns An operation whose `id` tracks processing and whose `fileId` identifies the file.
   * @throws {@link Errors.PineconeArgumentError} if the file ID, file input, or required filename is missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const operation = await assistant.upsertFile({
   *   assistantFileId: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
   *   path: 'returns-policy.pdf',
   * });
   * console.log(operation.id);
   * ```
   *
   * @see {@link Assistant.uploadFile} to create a file with an assigned ID and optional metadata.
   */
  upsertFile(options: UpsertFileOptions) {
    return this._upsertFile(options);
  }

  /**
   * Deletes a file from the assistant asynchronously.
   *
   * @param fileId - The ID of the file to delete.
   * @returns An operation to track deletion with {@link Assistant.describeOperation}.
   * @throws {@link Errors.PineconeArgumentError} if `fileId` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const operation = await assistant.deleteFile('1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b');
   * console.log(operation.id);
   * ```
   */
  deleteFile(fileId: string) {
    return this._deleteFile(fileId);
  }

  // --------- Operation methods ---------

  /**
   * Gets the current status of an asynchronous file operation.
   *
   * Call again to check progress; this call does not wait for completion.
   *
   * @param operationId - The operation ID returned by a file upload, upsert, deletion, or operation listing.
   * @returns Operation details including `status` and any error.
   * @throws {@link Errors.PineconeArgumentError} if `operationId` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const operation = await assistant.uploadFile({ path: 'returns-policy.pdf' });
   * const result = await assistant.describeOperation(operation.id);
   * console.log(result.status);
   * ```
   *
   * @see {@link Assistant.listOperations} to find operations.
   */
  describeOperation(operationId: string) {
    return this._describeOperation(operationId);
  }

  /**
   * Lists one page of asynchronous operations on the assistant.
   *
   * @param options - Optional operation filters, page size, and pagination token.
   * @returns Operations and pagination information; pass `pagination.next` as `paginationToken` for the next page.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const page = await assistant.listOperations({ status: 'Processing' });
   * console.log(page.operations);
   * if (page.pagination?.next) {
   *   const nextPage = await assistant.listOperations({
   *     status: 'Processing',
   *     paginationToken: page.pagination.next,
   *   });
   *   console.log(nextPage.operations);
   * }
   * ```
   *
   * @see {@link Assistant.describeOperation} for the status of one operation.
   */
  listOperations(options?: ListOperationsOptions) {
    if (!options) {
      options = {};
    }
    return this._listOperations(options);
  }

  /**
   * Retrieves relevant context snippets without generating an answer.
   *
   * @param options - A query or conversation messages, with optional file filter and snippet settings.
   * @returns Relevant snippets with source references and usage information.
   * @throws {@link Errors.PineconeArgumentError} if neither `query` nor `messages` is supplied.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'support-guide' });
   * const response = await assistant.context({ query: 'How do I return an order?' });
   * console.log(response.snippets);
   * ```
   *
   * @see {@link Assistant.chat} to generate an answer from the context.
   */
  context(options: ContextOptions) {
    return this._context(options);
  }
}
