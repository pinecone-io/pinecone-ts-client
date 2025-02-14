import { chat } from './data/chat';
import type {
  ChatOptions,
  ContextOptions,
  ListFilesOptions,
  UploadFileOptions,
} from './data/types';
import { chatCompletion } from './data/chatCompletion';
import { chatStream } from './data/chatStream';
import { chatCompletionStream } from './data/chatCompletionStream';
import { listFiles } from './data/listFiles';
import { describeFile } from './data/describeFile';
import { deleteFile } from './data/deleteFile';
import { uploadFile } from './data/uploadFile';
import { PineconeConfiguration } from '../data';
import { AsstDataOperationsProvider } from './data/asstDataOperationsProvider';
import { context } from './data/context';

export type {
  CreateAssistantOptions,
  UpdateAssistantOptions,
  UpdateAssistantResponse,
  AssistantStatusEnum,
  AssistantModel,
  AssistantList,
} from './control/types';
export type {
  ChatOptions,
  ChatModelEnum,
  ChoiceModel,
  FinishReasonEnum,
  StreamedChatResponse,
  StreamedChatCompletionResponse,
  BaseChunk,
  MessageStartChunk,
  ContentChunk,
  CitationChunk,
  MessageEndChunk,
  ContextOptions,
  ListFilesOptions,
  UploadFileOptions,
  AssistantFileModel,
  AssistantFileStatusEnum,
  AssistantFilesList,
} from './data/types';
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
 *  const assistant = pc.assistant('assistant-name');
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
  readonly _deleteFile: ReturnType<typeof deleteFile>;
  readonly _context: ReturnType<typeof context>;

  assistantName: string;

  /**
   * Creates an instance of the `Assistant` class.
   *
   * @param assistantName - The name of the assistant.
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

    this._chat = chat(this.assistantName, asstDataOperationsProvider);
    this._chatStream = chatStream(
      this.assistantName,
      asstDataOperationsProvider,
      this.config
    );
    this._chatCompletion = chatCompletion(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._chatCompletionStream = chatCompletionStream(
      this.assistantName,
      asstDataOperationsProvider,
      this.config
    );
    this._listFiles = listFiles(this.assistantName, asstDataOperationsProvider);
    this._describeFile = describeFile(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._uploadFile = uploadFile(
      this.assistantName,
      asstDataOperationsProvider,
      this.config
    );
    this._deleteFile = deleteFile(
      this.assistantName,
      asstDataOperationsProvider
    );
    this._context = context(this.assistantName, asstDataOperationsProvider);
  }

  // --------- Chat methods ---------

  /**
   * Sends a message to the assistant and receives a response. Retries the request if the server fails.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant(assistantName);
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
   * @param options - A {@link ChatOptions} object containing the message and optional parameters to send to the
   * assistant.
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
   * const assistant = pc.assistant(assistantName);
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
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant(assistantName);
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
   * //      content: "The data mentioned is described as \"some temporary data\"  [1].\n\nReferences:\n1. [test-chat.txt](https://storage.googleapis.com/knowledge-prod-files/0b3dc744-fc03-4752-af7a-0fa25e2ea732%2F940864ff-f412-4828-b772-3e39442aa011%2F7d031d41-60b1-4517-9050-ba0e210de17f.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=ke-prod-1%40pc-knowledge-prod.iam.gserviceaccount.com%2F20250214%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250214T062103Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&response-content-disposition=inline&response-content-type=text%2Fplain&X-Goog-Signature=54a609a124be5223d754bc7259a8307a5101f65c92680c98978ed23774e3eb22f53927bc18f38070167a670956b91419648c28d542fc97a8070851f4f27b6b492b621790858c6fa3c03986d8bb0c919348574f3539c503bac2b4879b026cac28298eb7dc7ebea3bbf61f9058eda9d04978a8bdd4dabd10f738d7d8b402f4ae517a85a42f5ce64ca4a8846789f3a45c296422898c638c677fe1d8035c135ee4a8496027da4fecc515990e532a54a9bad5f17a59a584c6092ba61c92f92eccc308e09df40150da55f1317f0e9a9e38f88f19ce5bbe6480aaaf265d4067b641bfdc0f425d7b2dd8ceb007f05c1847e60cb17b76205a804b13d2395385233b18d55e) \n"
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
   * @param options - A {@link ChatOptions} object containing the message and optional parameters to send
   * to an assistant.
   * @returns A promise that resolves to a {@link ChatCompletionModel} object containing the response from the assistant.
   */
  chatCompletion(options: ChatOptions) {
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
   * const assistant = pc.assistant(assistantName);
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
   * @param options - A {@link ChatOptions} object containing the message and optional parameters to send
   * to an assistant.
   * @returns A promise that resolves to a {@link ChatStream<StreamedChatCompletionResponse>}.
   */
  chatCompletionStream(options: ChatOptions) {
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
   * const assistant = pc.assistant(assistantName);
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
   * const assistant = pc.assistant(assistantName);
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
  describeFile(fileId: string) {
    return this._describeFile(fileId);
  }

  /**
   * Uploads a file to an assistant.
   *
   * Note: This method does *not* use the generated code from the OpenAPI spec.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant(assistantName);
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
  uploadFile(options: UploadFileOptions) {
    return this._uploadFile(options);
  }

  /**
   * Deletes a file uploaded to an assistant by ID.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistantName = 'test1';
   * const assistant = pc.assistant(assistantName);
   * const files = await assistant.listFiles();
   * let fileId: string;
   * if (files.files) {
   *    fileId = files.files[0].id;
   *    await assistant.deleteFile({fileId: fileId});
   *  }
   * ```
   *
   * @param options - A {@link DeleteFile} object containing the file ID to delete.
   * @returns A promise that resolves to void on success.
   */
  deleteFile(fileId: string) {
    return this._deleteFile(fileId);
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
   * const assistant = pc.assistant(assistantName);
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
  context(options: ContextOptions) {
    return this._context(options);
  }
}
