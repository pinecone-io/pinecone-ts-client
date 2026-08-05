import { Indexes } from './control/indexes';
import {
  createAssistant,
  CreateAssistantOptions,
  deleteAssistant,
  describeAssistant,
  updateAssistant,
  UpdateAssistantOptions,
  listAssistants,
  evaluate,
} from './assistant/control';
import { AssistantHostSingleton } from './assistant/assistantHostSingleton';
import type { HTTPHeaders } from './pinecone-generated-ts-fetch/db_data';
import {
  PineconeConfigurationError,
  PineconeEnvironmentVarsNotSupportedError,
} from './errors';
import { Index } from './data';
import type { PineconeConfiguration, RecordMetadata } from './data';
import { Inference } from './inference';
import { isBrowser } from './utils/environment';
import { asstControlOperationsBuilder } from './assistant/control/asstControlOperationsBuilder';
import { asstMetricsOperationsBuilder } from './assistant/control/asstMetricsOperationsBuilder';
import { Assistant } from './assistant';
import { IndexOptions, AssistantOptions } from './types';

/**
 * The `Pinecone` class is the main entrypoint to this sdk. You will use
 * instances of it to create and manage indexes as well as perform data
 * operations on those indexes after they are created.
 *
 * ### Initializing the client
 *
 * There is one piece of configuration required to use the Pinecone client: an API key. This value can be passed using environment variables or in code through a configuration object. Find your API key in the console dashboard at [https://app.pinecone.io](https://app.pinecone.io)
 *
 * ### Using environment variables
 *
 * The environment variables used to configure the client are the following:
 *
 * ```bash
 * export PINECONE_API_KEY="your_api_key"
 * export PINECONE_CONTROLLER_HOST="your_controller_host"
 * ```
 *
 * When these environment variables are set, the client constructor does not require any additional arguments.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * ```
 *
 * ### Using a configuration object
 *
 * If you prefer to pass configuration in code, the constructor accepts a config object containing the `apiKey` and `environment` values. This
 * could be useful if your application needs to interact with multiple projects, each with a different configuration.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone({
 *   apiKey: 'your_api_key',
 * });
 *
 * ```
 *
 * See {@link PineconeConfiguration} for a full description of available configuration options.
 */
export class Pinecone {
  /** @hidden */
  private _createAssistant: ReturnType<typeof createAssistant>;
  /** @hidden */
  private _deleteAssistant: ReturnType<typeof deleteAssistant>;
  /** @hidden */
  private _updateAssistant: ReturnType<typeof updateAssistant>;
  /** @hidden */
  private _describeAssistant: ReturnType<typeof describeAssistant>;
  /** @hidden */
  private _listAssistants: ReturnType<typeof listAssistants>;
  /** @hidden */
  private _evaluate: ReturnType<typeof evaluate>;

  public inference: Inference;
  /**
   * Control-plane operations for indexes, backups, restore jobs, and collections.
   *
   * @example
   * ```typescript
   * const list = await pc.indexes.list();
   * const indexModel = await pc.indexes.describe('my-index');
   * ```
   */
  public indexes: Indexes;

  /**
   * @example
   * ```
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone({
   *  apiKey: 'my-api-key',
   * });
   * ```
   *
   * @constructor
   * @param options - The configuration options for the Pinecone client: {@link PineconeConfiguration}.
   */
  constructor(options?: PineconeConfiguration) {
    if (options === undefined) {
      options = this._readEnvironmentConfig();
    }

    if (!options.apiKey) {
      throw new PineconeConfigurationError(
        'The client configuration must have required property: apiKey.',
      );
    }

    this.config = options;

    this._checkForBrowser();

    const asstControlApi = asstControlOperationsBuilder(this.config);
    const asstMetricsApi = asstMetricsOperationsBuilder(this.config);

    // Control-plane index operations
    this.indexes = new Indexes(this.config);

    // Assistant operations
    this._createAssistant = createAssistant(asstControlApi);
    this._deleteAssistant = deleteAssistant(asstControlApi);
    this._updateAssistant = updateAssistant(asstControlApi);
    this._describeAssistant = describeAssistant(asstControlApi);
    this._listAssistants = listAssistants(asstControlApi);
    this._evaluate = evaluate(asstMetricsApi);

    // Inference operations
    this.inference = new Inference(this.config);
  }

  /**
   * @internal
   * This method is used by {@link Pinecone.constructor} to read configuration from environment variables.
   *
   * It looks for the following environment variables:
   * - `PINECONE_API_KEY`
   * - `PINECONE_CONTROLLER_HOST`
   *
   * @returns A {@link PineconeConfiguration} object populated with values found in environment variables.
   */
  _readEnvironmentConfig(): PineconeConfiguration {
    if (typeof process === 'undefined' || !process || !process.env) {
      throw new PineconeEnvironmentVarsNotSupportedError(
        'Your execution environment does not support reading environment variables from process.env, so a' +
          ' configuration object is required when calling new Pinecone().',
      );
    }

    const environmentConfig = {};
    const requiredEnvVarMap = {
      apiKey: 'PINECONE_API_KEY',
    };
    const missingVars: Array<string> = [];
    for (const [key, envVar] of Object.entries(requiredEnvVarMap)) {
      const value = process.env[envVar] || '';
      if (!value) {
        missingVars.push(envVar);
      }
      environmentConfig[key] = value;
    }
    if (missingVars.length > 0) {
      throw new PineconeConfigurationError(
        `Since you called 'new Pinecone()' with no configuration object, we attempted to find client configuration in environment variables but the required environment variables were not set. Missing variables: ${missingVars.join(
          ', ',
        )}.`,
      );
    }

    const optionalEnvVarMap = {
      controllerHostUrl: 'PINECONE_CONTROLLER_HOST',
    };
    for (const [key, envVar] of Object.entries(optionalEnvVarMap)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        environmentConfig[key] = value;
      }
    }

    return environmentConfig as PineconeConfiguration;
  }

  /** @hidden */
  private config: PineconeConfiguration;

  /**
   * Creates a new Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.createAssistant({name: 'test1'});
   * // {
   * //  name: 'test11',
   * //  instructions: undefined,
   * //  metadata: undefined,
   * //  status: 'Initializing',
   * //  host: 'https://prod-1-data.ke.pinecone.io',
   * //  createdAt: 2025-01-08T22:52:49.652Z,
   * //  updatedAt: 2025-01-08T22:52:49.652Z
   * // }
   * ```
   *
   * @param options - A {@link CreateAssistantOptions} object containing the `name` of the Assistant to be created.
   * Optionally, users can also specify instructions, metadata, and host region. Region must be one of "us" or "eu"
   * and determines where the Assistant will be hosted.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async createAssistant(options: CreateAssistantOptions) {
    const assistant = await this._createAssistant(options);

    if (assistant.host) {
      AssistantHostSingleton._set(this.config, assistant.name, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Deletes an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.deleteAssistant('test1');
   * ```
   *
   * @param assistantName - The name of the Assistant to be deleted.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   */
  async deleteAssistant(assistantName: string) {
    await this._deleteAssistant(assistantName);
    AssistantHostSingleton._delete(this.config, assistantName);
    return Promise.resolve();
  }

  /**
   * Retrieves information about an Assistant by name, including its current
   * status (e.g. whether it is still initializing or ready to use).
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const test = await pc.describeAssistant('test1');
   * console.log(test);
   * // {
   * //  name: 'test1',
   * //  instructions: undefined,
   * //  metadata: undefined,
   * //  status: 'Ready',
   * //  host: 'https://prod-1-data.ke.pinecone.io',
   * //  createdAt: 2025-01-08T22:24:50.525Z,
   * //  updatedAt: 2025-01-08T22:24:52.303Z
   * // }
   * ```
   *
   * @param assistantName - The name of the Assistant to retrieve.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async describeAssistant(assistantName: string) {
    const assistant = await this._describeAssistant(assistantName);

    if (assistant.host) {
      AssistantHostSingleton._set(this.config, assistantName, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Retrieves a list of all Assistants for a given Pinecone API key.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistants = await pc.listAssistants();
   * console.log(assistants);
   * // {
   * //  assistants: [
   * //    {
   * //      name: 'test2',
   * //      instructions: 'test-instructions',
   * //      metadata: [Object],
   * //      status: 'Ready',
   * //      host: 'https://prod-1-data.ke.pinecone.io',
   * //      createdAt: 2025-01-06T19:14:18.633Z,
   * //      updatedAt: 2025-01-06T19:14:36.977Z
   * //    },
   * //  ]
   * // }
   * ```
   *
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to an object containing an array of {@link Assistant} models.
   */
  async listAssistants() {
    const assistantList = await this._listAssistants();

    // For any listAssistants calls we want to update the AssistantHostSingleton cache.
    // This prevents unneeded calls to describeAssistant for resolving the host for assistant operations.
    if (assistantList.assistants && assistantList.assistants.length > 0) {
      for (let i = 0; i < assistantList.assistants.length; i++) {
        const assistant = assistantList.assistants[i];
        if (assistant.host) {
          AssistantHostSingleton._set(
            this.config,
            assistant.name,
            assistant.host,
          );
        }
      }
    }

    return Promise.resolve(assistantList);
  }

  /**
   * Updates an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.updateAssistant({ name: 'test1', instructions: 'some new instructions!'});
   * // {
   * //  assistantName: test1,
   * //  instructions: 'some new instructions!',
   * //  metadata: undefined
   * // }
   * ```
   *
   * @param options - An {@link UpdateAssistantOptions} object containing the name of the assistant to be updated and
   * optional instructions and metadata.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to an {@link UpdateAssistantResponse} object.
   */
  updateAssistant(options: UpdateAssistantOptions) {
    return this._updateAssistant(options);
  }

  /**
   * Evaluates the alignment of a generated answer against a ground truth answer.
   * Returns metrics for correctness (precision), completeness (recall), and alignment (harmonic mean).
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.evaluate({
   *   question: "What is the capital of France?",
   *   answer: "The capital of France is Paris.",
   *   groundTruth: "Paris is the capital and most populous city of France."
   * });
   * console.log(result);
   * // {
   * //   metrics: {
   * //     correctness: 0.95,
   * //     completeness: 0.90,
   * //     alignment: 0.92
   * //   },
   * //   reasoning: { evaluatedFacts: [...] },
   * //   usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
   * // }
   * ```
   *
   * @param options - An {@link EvaluateOptions} object containing the question, answer, and groundTruth.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A Promise that resolves to an {@link AlignmentResponse} object containing metrics and reasoning.
   */
  evaluate(options: { question: string; answer: string; groundTruth: string }) {
    return this._evaluate(options);
  }

  /** @internal */
  _checkForBrowser() {
    if (isBrowser()) {
      console.warn(
        'The Pinecone SDK is intended for server-side use only. Using the SDK within a browser context can expose your API key(s). If you have deployed the SDK to production in a browser, please rotate your API keys.',
      );
    }
  }

  /**
   * @returns The configuration object that was passed to the Pinecone constructor.
   */
  getConfig() {
    return this.config;
  }

  /**
   * Targets a specific index for performing data operations.
   *
   * You can target an index by providing its `name`, its `host`, or both. If only `name` is provided,
   * the SDK will call {@link describeIndex} to resolve the host. If `host` is provided, the SDK will
   * perform data operations directly against that host.
   *
   * #### Targeting an index by host (recommended for production)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * // Get the host from describeIndex
   * const indexModel = await pc.indexes.describe('index-name');
   * const index = pc.index({ host: indexModel.host })
   * ```
   *
   * #### Targeting an index by name
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * const index = pc.index({ name: 'index-name' })
   * ```
   *
   * #### Targeting an index by name (legacy string syntax - deprecated)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * // Legacy syntax - will be removed in next major version
   * const index = pc.index('index-name')
   * ```
   *
   * #### Targeting an index by host
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone()
   *
   * const index = pc.index({ host: 'index-name-abc123.svc.pinecone.io' })
   * ```
   *
   * #### Targeting an index, with user-defined Metadata types
   *
   * If you are storing metadata alongside your vector values inside your Pinecone records, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking when upserting and querying data.
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   *
   * type MovieMetadata = {
   *   title: string,
   *   runtime: numbers,
   *   genre: 'comedy' | 'horror' | 'drama' | 'action'
   * }
   *
   * // Specify a custom metadata type while targeting the index
   * const indexModel = await pc.indexes.describe('test-index');
   * const index = pc.index<MovieMetadata>({ host: indexModel.host });
   *
   * // Now you get type errors if upserting malformed metadata
   * await index.upsert({
   *   records: [{
   *     id: '1234',
   *     values: [
   *       .... // embedding values
   *     ],
   *     metadata: {
   *       title: 'Gone with the Wind',
   *       runtime: 238,
   *       genre: 'drama',
   *
   *       // @ts-expect-error because category property not in MovieMetadata
   *       category: 'classic'
   *     }
   *   }]
   * })
   *
   * const results = await index.query({
   *    vector: [
   *     ... // query embedding
   *    ],
   *    filter: { genre: { '$eq': 'drama' }}
   * })
   * const movie = results.matches[0];
   *
   * if (movie.metadata) {
   *   // Since we passed the MovieMetadata type parameter above,
   *   // we can interact with metadata fields without having to
   *   // do any typecasting.
   *   const { title, runtime, genre } = movie.metadata;
   *   console.log(`The best match in drama was ${title}`)
   * }
   * ```
   *
   * @typeParam T - The type of metadata associated with each record.
   * @param options - The {@link IndexOptions} for targeting the index.
   * @returns An {@link Index} object that can be used to perform data operations.
   */
  index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * @deprecated Use the options object pattern instead: `pc.index({ name: 'index-name' })`.
   * This signature will be removed in the next major version.
   */
  index<T extends RecordMetadata = RecordMetadata>(
    indexName: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T>;
  index<T extends RecordMetadata = RecordMetadata>(
    optionsOrName: IndexOptions | string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T> {
    // Handle legacy string-based API
    if (typeof optionsOrName === 'string') {
      return new Index<T>(
        {
          name: optionsOrName,
          host: indexHostUrl,
          additionalHeaders: additionalHeaders,
        },
        this.config,
      );
    }

    // Handle new options-based API
    return new Index<T>(
      {
        name: optionsOrName.name,
        namespace: optionsOrName.namespace,
        host: optionsOrName.host,
        additionalHeaders: optionsOrName.additionalHeaders,
      },
      this.config,
    );
  }

  /**
   * {@inheritDoc index}
   */
  // Alias method to match the Python SDK capitalization
  Index<T extends RecordMetadata = RecordMetadata>(
    options: IndexOptions,
  ): Index<T>;
  /**
   * @deprecated Use the options object pattern instead: `pc.Index({ name: 'index-name' })`.
   * This signature will be removed in the next major version.
   */
  Index<T extends RecordMetadata = RecordMetadata>(
    indexName: string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T>;
  Index<T extends RecordMetadata = RecordMetadata>(
    optionsOrName: IndexOptions | string,
    indexHostUrl?: string,
    additionalHeaders?: HTTPHeaders,
  ): Index<T> {
    return this.index<T>(optionsOrName as any, indexHostUrl, additionalHeaders);
  }

  /**
   * Targets a specific assistant for performing operations.
   *
   * Once an assistant is targeted, you can perform operations such as uploading files,
   * updating instructions, and chatting.
   *
   * #### Targeting an assistant (options object - recommended)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const assistant = pc.assistant({ name: 'my-assistant' });
   *
   * // Upload a file to the assistant
   * await assistant.uploadFile({
   *   path: 'test-file.txt',
   *   metadata: { description: 'Sample test file' }
   * });
   * ```
   *
   * #### Targeting an assistant (legacy string syntax - deprecated)
   *
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * // Legacy syntax - will be removed in next major version
   * const assistant = pc.assistant('my-assistant');
   * ```
   *
   * #### Full example with chat
   *
   * ```typescript
   * const chatResp = await assistant.chat({
   *   messages: [{ role: 'user', content: 'What is the capital of France?' }],
   * });
   * console.log(chatResp);
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
   * @param options - The {@link AssistantOptions} for targeting the assistant.
   * @returns An {@link Assistant} object that can be used to perform assistant-related operations.
   */
  assistant(options: AssistantOptions): Assistant;
  /**
   * @deprecated Use the options object pattern instead: `pc.assistant({ name: 'assistant-name' })`.
   * This signature will be removed in the next major version.
   */
  assistant(name: string, host?: string): Assistant;
  assistant(
    optionsOrName: AssistantOptions | string,
    host?: string,
  ): Assistant {
    // Handle legacy string-based API
    if (typeof optionsOrName === 'string') {
      return new Assistant(
        {
          name: optionsOrName,
          host: host,
        },
        this.config,
      );
    }

    // Handle new options-based API
    return new Assistant(optionsOrName, this.config);
  }

  /**
   * {@inheritDoc assistant}
   */
  // Alias method
  Assistant(options: AssistantOptions): Assistant;
  /**
   * @deprecated Use the options object pattern instead: `pc.Assistant({ name: 'assistant-name' })`.
   * This signature will be removed in the next major version.
   */
  Assistant(name: string, host?: string): Assistant;
  Assistant(
    optionsOrName: AssistantOptions | string,
    host?: string,
  ): Assistant {
    return this.assistant(optionsOrName as any, host);
  }
}
