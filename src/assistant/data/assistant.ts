import { chatClosed, ChatRequest } from './chat';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';
import { DeleteFile, deleteFileClosed } from './deleteFile';
import { UploadFile, uploadFileClosed } from './uploadFile';
import { PineconeConfiguration } from '../../data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { Context, contextClosed } from './context';
import { chatCompletionClosed, ChatCompletionRequest } from './chatCompletion';

/**
 * The `Assistant` class holds the data plane methods for interacting with
 *  [Assistants](https://docs.pinecone.io/guides/assistant/understanding-assistant).
 *
 *  This class's methods are instantiated on a Pinecone object and are used to interact with the data plane of an Assistant.
 *
 *  @example
 *  ```typescript
 *  import { Pinecone } from '@pinecone-database/pinecone';
 *  const pc = new Pinecone();
 *  const assistant = pc.Assistant('assistant-name');
 *  ```
 */
export class Assistant {
  private config: PineconeConfiguration;

  readonly _chat: ReturnType<typeof chatClosed>;
  readonly _chatCompletions: ReturnType<typeof chatCompletionClosed>;
  readonly _listFiles: ReturnType<typeof listFilesClosed>;
  readonly _describeFile: ReturnType<typeof describeFileClosed>;
  readonly _uploadFile: ReturnType<typeof uploadFileClosed>;
  readonly _deleteFile: ReturnType<typeof deleteFileClosed>;
  readonly _context: ReturnType<typeof contextClosed>;

  assistantName: string;

  /**
   * Creates an instance of the `Assistant` class.
   *
   * @param assistantName - The name of the Assistant.
   * @param config - The Pinecone configuration object containing an API key and other configuration parameters
   * needed for API calls.
   *
   * @throws An error if no assistant name is provided.
   */
  constructor(assistantName: string, config: PineconeConfiguration) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }
    this.config = config;
    const asstDataOperationsProvider = new AsstDataOperationsProvider(
      this.config,
      assistantName
    );
    this.assistantName = assistantName;

    this._chat = chatClosed(this.assistantName, asstDataOperationsProvider);
    this._chatCompletions = chatCompletionClosed(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._listFiles = listFilesClosed(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._describeFile = describeFileClosed(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._uploadFile = uploadFileClosed(this.assistantName, this.config);
    this._deleteFile = deleteFileClosed(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._context = contextClosed(
      this.assistantName,
      asstDataOperationsProvider
    );
  }

  // --------- Chat methods ---------

  /**
   * Sends a message to the Assistant and receives a response. Retries the request if the server fails.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
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
   * }
   * ```
   *
   * @param options - A {@link ChatRequest} object containing the message and optional parameters to send to the
   * Assistant.
   * @returns A promise that resolves to a {@link ChatModel} object containing the response from the Assistant.
   */
  chat(options: ChatRequest) {
    return this._chat(options);
  }

  /**
   * Sends a message to the Assistant and receives a response. Response is compatible with
   * [OpenAI's Chat Completion API](https://platform.openai.com/docs/guides/text-generation. Retries the request if the server fails.
   *
   * See {@link chat} for example usage.
   *
   * @param options - A {@link ChatCompletionRequest} object containing the message and optional parameters to send
   * to an Assistant.
   */
  chatCompletions(options: ChatCompletionRequest) {
    return this._chatCompletions(options);
  }

  // --------- File methods ---------

  /**
   * Lists files (with optional filter) uploaded to an Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
   * const files = await assistant.listFiles({filter: {metadata: {key: 'value'}}});
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
   * @param options - A {@link ListFiles} object containing optional parameters to filter the list of files.
   * @returns A promise that resolves to a {@link ListFiles200Response} object containing a list of files.
   */
  listFiles(options?: ListFiles) {
    if (!options) {
      options = {};
    }
    return this._listFiles(options);
  }

  /**
   * Describes a file uploaded to an Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
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
   * @param options - A {@link DescribeFile} object containing the file ID to describe.
   * @returns A promise that resolves to a {@link AssistantFileModel} object containing the file details.
   */
  describeFile(options: DescribeFile) {
    return this._describeFile(options);
  }

  /**
   * Uploads a file to an Assistant.
   *
   * Note: This method does *not* use the generated code from the OpenAPI spec.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
   * await assistant.uploadFile({path: "test-file.txt", metadata: {"test-key": "test-value"}})
   * // {
   * //  name: 'test-file.txt',
   * //  id: '921ad74c-2421-413a-8c86-fca81ceabc5c',
   * //  metadata: { 'test-key': 'test-value' },
   * //  createdOn: Invalid Date,  // Note: these dates resolve in seconds
   * //  updatedOn: Invalid Date,
   * //  status: 'Processing',
   * //  percentDone: null,
   * //  signedUrl: null,
   * //  errorMessage: null
   * // }
   * ```
   *
   * @param options - A {@link UploadFile} object containing the file path and optional metadata.
   * @returns A promise that resolves to a {@link AssistantFileModel} object containing the file details.
   */
  uploadFile(options: UploadFile) {
    return this._uploadFile(options);
  }

  /**
   * Deletes a file uploaded to an Assistant by ID.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
   * const files = await assistant.listFiles();
   * let fileId: string;
   * if (files.files) {
   *    fileId = files.files[0].id;
   *    await assistant.deleteFile({fileId: fileId});
   *  }
   * ```
   *
   * @param options - A {@link DeleteFile} object containing the file ID to delete.
   */
  deleteFile(options: DeleteFile) {
    return this._deleteFile(options);
  }

  /**
   * Retrieves [the context snippets](https://docs.pinecone.io/guides/assistant/understanding-context-snippets) used
   * by an Assistant during the retrieval process.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.Assistant(assistantName);
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
   * @param options
   * @returns A promise that resolves to a {@link Context} object containing the context snippets.
   */
  context(options: Context) {
    return this._context(options);
  }
}
