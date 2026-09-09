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
 * Assistants manages assistants and evaluates generated answers.
 *
 * Access it through `pc.assistants`; do not construct it directly.
 * Use {@link Pinecone.assistant} to chat with one assistant and manage its files.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const result = await pc.assistants.list();
 * console.log(result.assistants);
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

  /** @internal */
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
   * Creates an assistant.
   *
   * Check its status with {@link Assistants.describe} before using it.
   *
   * @param options - Assistant name, such as `support-guide`, and optional instructions, metadata, and region.
   * @returns Assistant details, including its status and host.
   * @throws {@link Errors.PineconeArgumentError} if options are missing or the region is unsupported.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = await pc.assistants.create({ name: 'support-guide' });
   * console.log(assistant.status);
   * ```
   */
  async create(options: CreateAssistantOptions) {
    const assistant = await this._createAssistant(options);

    if (assistant.host) {
      AssistantHostSingleton._set(this._config, assistant.name, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Deletes an assistant by name.
   *
   * @param assistantName - The name of the assistant to delete, such as `support-guide`.
   * @returns Resolves when the deletion request completes.
   * @throws {@link Errors.PineconeArgumentError} if `assistantName` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistants.delete('support-guide');
   * ```
   */
  async delete(assistantName: string) {
    await this._deleteAssistant(assistantName);
    AssistantHostSingleton._delete(this._config, assistantName);
    return Promise.resolve();
  }

  /**
   * Gets assistant configuration and readiness status.
   *
   * @param assistantName - The name of the assistant, such as `support-guide`.
   * @returns Assistant details, including its status and host.
   * @throws {@link Errors.PineconeArgumentError} if `assistantName` is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistant = await pc.assistants.describe('support-guide');
   * console.log(assistant.status);
   * ```
   *
   * @see {@link Assistants.list} to discover assistants.
   */
  async describe(assistantName: string) {
    const assistant = await this._describeAssistant(assistantName);

    if (assistant.host) {
      AssistantHostSingleton._set(this._config, assistantName, assistant.host);
    }

    return Promise.resolve(assistant);
  }

  /**
   * Lists assistants in the project.
   *
   * @returns Assistant details in `assistants`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.list();
   * console.log(result.assistants);
   * ```
   *
   * @see {@link Assistants.describe} for details of one assistant.
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
   * Updates assistant instructions or metadata.
   *
   * Omitted fields are left unchanged; an empty instructions string is not applied.
   *
   * @param options - The assistant name and the instructions or metadata to update.
   * @returns The updated assistant name, instructions, and metadata.
   * @throws {@link Errors.PineconeArgumentError} if options or the assistant name are missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.update({
   *   name: 'support-guide',
   *   instructions: 'Answer using the uploaded support policies and cite your sources.',
   * });
   * console.log(result.instructions);
   * ```
   */
  update(options: UpdateAssistantOptions) {
    return this._updateAssistant(options);
  }

  /**
   * Evaluates a generated answer against a ground truth answer.
   *
   * @param options - The question, generated `answer`, and reference answer in `groundTruth`.
   * @returns Correctness, completeness, and alignment metrics, with reasoning and usage.
   * @throws {@link Errors.PineconeArgumentError} if options are missing or an answer or question is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const result = await pc.assistants.evaluate({
   *   question: 'Where can I start a return?',
   *   answer: 'Start a return from your order history.',
   *   groundTruth: 'Customers can start returns from their order history.',
   * });
   * console.log(result.metrics);
   * ```
   */
  evaluate(options: { question: string; answer: string; groundTruth: string }) {
    return this._evaluate(options);
  }
}
