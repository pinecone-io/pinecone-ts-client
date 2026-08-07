import {
  createAssistant,
  CreateAssistantOptions,
  deleteAssistant,
  describeAssistant,
  updateAssistant,
  UpdateAssistantOptions,
  listAssistants,
  evaluate,
} from './index';
import { asstControlOperationsBuilder } from './asstControlOperationsBuilder';
import { asstMetricsOperationsBuilder } from './asstMetricsOperationsBuilder';
import { AssistantHostSingleton } from '../assistantHostSingleton';
import type { PineconeConfiguration } from '../../data';

/**
 * Control-plane operations for assistants. Access via `pc.assistants`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const assistants = await pc.assistants.list();
 * ```
 */
export class Assistants {
  private _config: PineconeConfiguration;
  private _createAssistant: ReturnType<typeof createAssistant>;
  private _deleteAssistant: ReturnType<typeof deleteAssistant>;
  private _updateAssistant: ReturnType<typeof updateAssistant>;
  private _describeAssistant: ReturnType<typeof describeAssistant>;
  private _listAssistants: ReturnType<typeof listAssistants>;
  private _evaluate: ReturnType<typeof evaluate>;

  constructor(config: PineconeConfiguration) {
    this._config = config;
    const asstControlApi = asstControlOperationsBuilder(config);
    const asstMetricsApi = asstMetricsOperationsBuilder(config);

    this._createAssistant = createAssistant(asstControlApi);
    this._deleteAssistant = deleteAssistant(asstControlApi);
    this._updateAssistant = updateAssistant(asstControlApi);
    this._describeAssistant = describeAssistant(asstControlApi);
    this._listAssistants = listAssistants(asstControlApi);
    this._evaluate = evaluate(asstMetricsApi);
  }

  /**
   * Creates a new Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistants.create({name: 'test1'});
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
  async create(options: CreateAssistantOptions) {
    const assistant = await this._createAssistant(options);

    if (assistant.host) {
      AssistantHostSingleton._set(this._config, assistant.name, assistant.host);
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
   * await pc.assistants.delete('test1');
   * ```
   *
   * @param assistantName - The name of the Assistant to be deleted.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   */
  async delete(assistantName: string) {
    await this._deleteAssistant(assistantName);
    AssistantHostSingleton._delete(this._config, assistantName);
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
   * const test = await pc.assistants.describe('test1');
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
  async describe(assistantName: string) {
    const assistant = await this._describeAssistant(assistantName);

    if (assistant.host) {
      AssistantHostSingleton._set(this._config, assistantName, assistant.host);
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
   * const assistants = await pc.assistants.list();
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
  async list() {
    const assistantList = await this._listAssistants();

    // For any listAssistants calls we want to update the AssistantHostSingleton cache.
    // This prevents unneeded calls to describeAssistant for resolving the host for assistant operations.
    if (assistantList.assistants && assistantList.assistants.length > 0) {
      for (let i = 0; i < assistantList.assistants.length; i++) {
        const assistant = assistantList.assistants[i];
        if (assistant.host) {
          AssistantHostSingleton._set(
            this._config,
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
   * await pc.assistants.update({ name: 'test1', instructions: 'some new instructions!'});
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
  update(options: UpdateAssistantOptions) {
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
   * const result = await pc.assistants.evaluate({
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
}
