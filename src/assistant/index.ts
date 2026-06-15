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
 * The `Assistant` class holds the data plane methods for interacting with
 *  [Assistants](https://docs.pinecone.io/guides/assistant/understanding-assistant).
 *
 *  This class can be instantiated through a {@link Pinecone} object, and is used to interact with a specific assistant.
 *
 *  @example
 *  ```typescript
 *  import { Pinecone } from '@pinecone-database/pinecone';
 *  const pc = new Pinecone();
 *  const assistant = pc.assistant({ name: 'assistant-name' });
 *  ```
 */
export class Assistant {
  private config: PineconeConfiguration;

  readonly _chat: ReturnType<typeof chat>;
  readonly _chatStream: ReturnType<typeof chatStream>;
  readonly _chatCompletion: ReturnType<typeof chatCompletion>;
  readonly _chatCompletionStream: ReturnType<typeof chatCompletionStream>;
  readonly _listFiles: ReturnType<typeof listFiles>;
  readonly _describeFile: ReturnType<typeof describeFile>;
  readonly _uploadFile: ReturnType<typeof uploadFile>;
  readonly _upsertFile: ReturnType<typeof upsertFile>;
  readonly _deleteFile: ReturnType<typeof deleteFile>;
  readonly _describeOperation: ReturnType<typeof describeOperation>;
  readonly _listOperations: ReturnType<typeof listOperations>;
  readonly _context: ReturnType<typeof context>;

  assistantName: string;

  /**
   * Creates an instance of the `Assistant` class.
   *
   * @param options - The {@link AssistantOptions} for targeting the assistant.
   * @param config - The Pinecone configuration object containing an API key and other configuration parameters
   * needed for API calls.
   *
   * @throws An error if no assistant name is provided.
   */
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
   * Sends a message to the assistant and receives a response. Retries the request if the server fails.
   *
   * This is the recommended way to chat with an assistant: it offers more
   * functionality and control over the assistant's responses and references
   * (e.g. structured citations) than the OpenAI-compatible
   * {@link chatCompletion} interface.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const chatResp = await assistant.chat({messages: [{role: 'user', content: "What is the capital of France?"}]});
   * // {
   * //  id: '000000000000000023e7fb015be9d0ad',
   * //  finishReason: 'stop',
   * //  message: {
   * //    role: 'assistant',
   * //    content: 'The capital of France is Paris.'
   * //  },
   * //  model: 'gpt-4o-2024-05-13',
   * //  citations: [ { position: 209, references: [Array] } ],
   * //  usage: { promptTokens: 493, completionTokens: 38, totalTokens: 531 }
   * // }
   * ```
   *
   * @example
   * Chat with multimodal context enabled:
   * ```typescript
   * const chatResp = await assistant.chat({
   *   messages: [{role: 'user', content: "What do the charts show?"}],
   *   contextOptions: {
   *     multimodal: true,
   *     includeBinaryContent: true
   *   }
   * });
   * ```
   *
   * @param options - A {@link ChatOptions} object containing the message and optional parameters to send to the
   * assistant, including contextOptions for controlling multimodal content.
   * @returns A promise that resolves to a {@link ChatModel} object containing the response from the assistant.
   */
  chat(options: ChatOptions) {
    return this._chat(options);
  }

  /**
   * Sends a message to the assistant and receives a streamed response as {@link ChatStream<StreamedChatResponse>}. Retries the request if the server fails.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const chatStream = await assistant.chatStream({ messages: [{ role: 'user', content: 'What is the capital of France?'}]});
   *
   * // stream the response and log each chunk
   * for await (const chunk of newStream) {
   *   console.log(chunk);
   * }
   * // each chunk will have a variable shape depending on the type:
   * // { type:"message_start", id:"response_id", model:"gpt-4o-2024-05-13", role:"assistant"}
   * // { type:"content_chunk", id:"response_id", model:"gpt-4o-2024-05-13", delta:{ content:"The"}}
   * // { type:"content_chunk", id:"response_id", model:"gpt-4o-2024-05-13", delta:{ content:" test"}}
   * // { type:"message_end", id:"response_id", model:"gpt-4o-2024-05-13", finishReason:"stop",usage:{ promptTokens:371,completionTokens:48,totalTokens:419}}
   * ```
   *
   * @param options - A {@link ChatOptions} object containing the message and optional parameters to send to the
   * assistant.
   * @returns A promise that resolves to a {@link ChatStream<StreamedChatResponse>}.
   */
  chatStream(options: ChatOptions) {
    return this._chatStream(options);
  }

  /**
   * Sends a message to the assistant and receives a response that is compatible with
   * [OpenAI's Chat Completion API](https://platform.openai.com/docs/guides/text-generation. Retries the request if the server fails.
   *
   * This interface is useful when you need inline citations or OpenAI-compatible
   * responses, but has limited functionality compared to {@link chat}, which is
   * the recommended interface for chatting with an assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const chatCompletion = await assistant.chatCompletion({ messages: [{ role: 'user', content: 'What is the capital of France?' }]});
   * console.log(chatCompletion);
   * // {
   * //  id: "response_id",
   * //  choices: [
   * //  {
   * //    finishReason: "stop",
   * //    index: 0,
   * //    message: {
   * //      role: "assistant",
   * //      content: "The data mentioned is described as \"some temporary data\"  [1].\n\nReferences:\n1. [test-chat.txt](https://storage.googleapis.com/knowledge-prod-files/your_file_resource) \n"
   * //    }
   * //   }
   * //  ],
   * //  model: "gpt-4o-2024-05-13",
   * //  usage: {
   * //    promptTokens: 371,
   * //    completionTokens: 19,
   * //    totalTokens: 390
   * //  }
   * // }
   * ```
   *
   * @param options - A {@link ChatCompletionOptions} object containing the message and optional parameters to send
   * to an assistant.
   * @returns A promise that resolves to a {@link ChatCompletionModel} object containing the response from the assistant.
   */
  chatCompletion(options: ChatCompletionOptions) {
    return this._chatCompletion(options);
  }

  /**
   * Sends a message to the assistant and receives a streamed response as {@link ChatStream<StreamedChatCompletionResponse>}. Response is compatible with
   * [OpenAI's Chat Completion API](https://platform.openai.com/docs/guides/text-generation. Retries the request if the server fails.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const chatStream = await assistant.chatCompletionStream({messages: [{role: 'user', content: "What is the capital of France?"}]});
   *
   * // stream the response and log each chunk
   * for await (const chunk of newStream) {
   *   if (chunk.choices.length > 0 && chunk.choices[0].delta.content) {
   *     process.stdout.write(chunk.choices[0].delta.content);
   *   }
   * }
   * // { id: 'response_id', choices: [{ index: 0, delta: { role: 'assistant' }, finishReason: null }], model: 'gpt-4o-2024-05-13', usage: null }
   * // { id: 'response_id', choices: [{ index: 0, delta: { content: 'The' }}, finishReason: null }], model: 'gpt-4o-2024-05-13', usage: null }
   * // { id: 'response_id', choices: [{ index: 0, delta: { content: ' test' }}, finishReason: null }], model: 'gpt-4o-2024-05-13', usage: null }
   * // { id: 'response_id', choices: [], model: 'gpt-4o-2024-05-13', usage: { promptTokens: 371, completionTokens: 48, totalTokens: 419 }}
   * ```
   *
   * @param options - A {@link ChatCompletionOptions} object containing the message and optional parameters to send
   * to an assistant.
   * @returns A promise that resolves to a {@link ChatStream<StreamedChatCompletionResponse>}.
   */
  chatCompletionStream(options: ChatCompletionOptions) {
    return this._chatCompletionStream(options);
  }

  // --------- File methods ---------

  /**
   * Lists files (with optional filter) uploaded to an assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const files = await assistant.listFiles({filter: {key: 'value'}});
   * console.log(files);
   * // {
   * //  files: [
   * //    {
   * //      name: 'temp-file.txt',
   * //      id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
   * //      metadata: undefined,
   * //      createdOn: 2025-01-06T19:14:21.969Z,
   * //      updatedOn: 2025-01-06T19:14:36.925Z,
   * //      status: 'Available',
   * //      percentDone: 1,
   * //      signedUrl: undefined,
   * //      errorMessage: undefined
   * //    }
   * //  ]
   * // }
   * ```
   *
   * @param options - A {@link ListFilesOptions} object containing optional parameters to filter the list of files.
   * @returns A promise that resolves to a {@link AssistantFilesList} object containing a list of files.
   */
  listFiles(options?: ListFilesOptions) {
    if (!options) {
      options = {};
    }
    return this._listFiles(options);
  }

  /**
   * Describes a file uploaded to an assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const files = await assistant.listFiles();
   * let fileId: string;
   * if (files.files) {
   *     fileId = files.files[0].id;
   * } else {
   *     fileId = '';
   * }
   * const resp = await assistant.describeFile({fileId: fileId})
   * console.log(resp);
   * // {
   * //  name: 'test-file.txt',
   * //  id: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
   * //  metadata: undefined,
   * //  createdOn: 2025-01-06T19:14:21.969Z,
   * //  updatedOn: 2025-01-06T19:14:36.925Z,
   * //  status: 'Available',
   * //  percentDone: 1,
   * //  signedUrl: undefined,
   * //   errorMessage: undefined
   * // }
   * ```
   *
   * @param fileId - The ID of the file to describe.
   * @param includeUrl - Whether to include the signed URL in the response. Defaults to true.
   * @returns A promise that resolves to a {@link AssistantFileModel} object containing the file details.
   */
  describeFile(fileId: string, includeUrl: boolean = true) {
    return this._describeFile(fileId, includeUrl);
  }

  /**
   * Uploads a file to an assistant.
   *
   * Accepts either a local file path or an in-memory `Buffer`, `Blob`, or
   * Node.js `ReadableStream`. Use the `file` + `fileName` form to forward an
   * incoming HTTP upload stream directly to the assistant without writing it
   * to disk or buffering the entire file in memory.
   *
   * @example
   * Upload from a local path:
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.Assistant({ name: 'my-assistant' });
   * await assistant.uploadFile({ path: 'report.pdf', metadata: { category: 'reports' } });
   * ```
   *
   * @example
   * Upload from a Buffer (e.g. from multer memory storage):
   * ```typescript
   * // req.file.buffer is a Buffer provided by multer
   * await assistant.uploadFile({
   *   file: req.file.buffer,
   *   fileName: req.file.originalname,
   * });
   * ```
   *
   * @example
   * Upload from a ReadableStream (zero server-side buffering):
   * ```typescript
   * // Forward an incoming upload stream directly — no disk write, no memory spike.
   * // Note: automatic retries are disabled for stream inputs because the stream
   * // is consumed after the first read and cannot be replayed.
   * await assistant.uploadFile({
   *   file: req.file.stream,   // e.g. from busboy / @fastify/multipart
   *   fileName: req.file.filename,
   * });
   * ```
   *
   * @example
   * Upload a file with multimodal processing enabled:
   * ```typescript
   * await assistant.uploadFile({
   *   path: 'document-with-images.pdf',
   *   metadata: { category: 'reports' },
   *   multimodal: true,
   * });
   * ```
   *
   * @param options - A {@link UploadFileOptions} object. Provide either
   *   `path` (local file path) or `file` ({@link Uploadable}) + `fileName`,
   *   along with optional `metadata` and `multimodal` flags.
   * @returns A promise that resolves to an {@link OperationModel} describing the async upload operation. Use `operation.fileId` to track the file once processing begins.
   */
  uploadFile(options: UploadFileOptions) {
    return this._uploadFile(options);
  }

  /**
   * Creates or replaces a file on an assistant at a caller-supplied file ID.
   *
   * If a file with the given `assistantFileId` already exists, its content is
   * replaced; otherwise a new file is created with that identifier. This makes
   * upsert idempotent by ID — useful when you own the ID space, e.g. mirroring
   * your own document IDs into the assistant or re-syncing a changed source
   * document to the same ID.
   *
   * Contrast with {@link uploadFile}, which always creates a new file with a
   * server-generated ID and additionally supports `metadata`. `upsertFile`
   * does *not* accept metadata.
   *
   * Accepts the same file inputs as {@link uploadFile} — a local file path or
   * an in-memory `Buffer`, `Blob`, or Node.js `ReadableStream`. Like upload,
   * this is asynchronous: poll the returned operation with
   * {@link describeOperation} to track completion.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'my-assistant' });
   * // Create-or-replace the file at this ID with new content.
   * const operation = await assistant.upsertFile({
   *   assistantFileId: '1a56ddd0-c6d8-4295-80c0-9bfd6f5cb87b',
   *   path: 'report.pdf',
   * });
   * const status = await assistant.describeOperation(operation.id);
   * ```
   *
   * @param options - An {@link UpsertFileOptions} object. Provide the
   *   `assistantFileId` to create or replace, along with either `path`
   *   (local file path) or `file` ({@link Uploadable}) + `fileName`, and an
   *   optional `multimodal` flag.
   * @returns A promise that resolves to an {@link OperationModel} describing the async upsert operation.
   */
  upsertFile(options: UpsertFileOptions) {
    return this._upsertFile(options);
  }

  /**
   * Deletes a file uploaded to an assistant by ID.
   *
   * This is an asynchronous operation: the returned {@link OperationModel} can
   * be polled for completion via {@link describeOperation}.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const files = await assistant.listFiles();
   * if (files.files) {
   *    const fileId = files.files[0].id;
   *    await assistant.deleteFile(fileId);
   *  }
   * ```
   *
   * @param fileId - The ID of the file to delete.
   * @returns A promise that resolves to an {@link OperationModel} describing the async delete operation.
   */
  deleteFile(fileId: string) {
    return this._deleteFile(fileId);
  }

  // --------- Operation methods ---------

  /**
   * Describes an async operation (such as a file upload or delete) performed on
   * the assistant. Use this to poll the status of an {@link OperationModel}
   * returned by {@link uploadFile}, {@link upsertFile}, or {@link deleteFile}.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'test1' });
   * const operation = await assistant.uploadFile({ path: 'report.pdf' });
   * const status = await assistant.describeOperation(operation.id);
   * console.log(status.status); // 'Processing' | 'Completed' | 'Failed'
   * ```
   *
   * @param operationId - The ID of the operation to describe.
   * @returns A promise that resolves to an {@link OperationModel} describing the operation.
   */
  describeOperation(operationId: string) {
    return this._describeOperation(operationId);
  }

  /**
   * Lists the async operations (such as file uploads and deletes) performed on
   * the assistant, with optional filters. Returns operations that are in
   * progress, as well as recently completed or failed operations. Both
   * successful and failed operations are retained for 30 days after completion.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'test1' });
   * const { operations } = await assistant.listOperations({ status: 'Processing' });
   * console.log(operations);
   * ```
   *
   * @param options - An optional {@link ListOperationsOptions} object to filter and paginate the operations.
   * @returns A promise that resolves to an {@link OperationList} object containing the list of operations.
   */
  listOperations(options?: ListOperationsOptions) {
    if (!options) {
      options = {};
    }
    return this._listOperations(options);
  }

  /**
   * Retrieves [the context snippets](https://docs.pinecone.io/guides/assistant/understanding-context-snippets) used
   * by an assistant during the retrieval process.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant({ name: assistantName });
   * const response = await assistant.context({query: "What is the capital of France?"});
   * console.log(response);
   * // {
   * //  snippets: [
   * //    {
   * //      type: 'text',
   * //      content: 'The capital of France is Paris.',
   * //      score: 0.9978925,
   * //      reference: [Object]
   * //    },
   * //  ],
   * //  usage: { promptTokens: 527, completionTokens: 0, totalTokens: 527 }
   * // }
   * ```
   *
   * @example
   * Retrieve multimodal context snippets with image data:
   * ```typescript
   * const response = await assistant.context({
   *   query: "Show me charts about revenue",
   *   multimodal: true,
   *   includeBinaryContent: true
   * });
   * ```
   *
   * @param options - A {@link ContextOptions} object containing the query or messages, optional filter, and optional multimodal parameters.
   * @returns A promise that resolves to a {@link ContextModel} object containing the context snippets.
   */
  context(options: ContextOptions) {
    return this._context(options);
  }
}
