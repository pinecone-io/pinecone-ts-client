import {
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsApiCtrl,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import { MetricsApi } from '../../pinecone-generated-ts-fetch/assistant_evaluation';
// import { AssistantHostSingleton } from '../assistantHostSingleton';
import { PineconeConfiguration } from '../../data';
import { createAssistant, CreateAssistantOptions } from './createAssistant';
import { deleteAssistant } from './deleteAssistant';
import { describeAssistant } from './describeAssistant';
import { listAssistants } from './listAssistants';
import { UpdateAssistantOptions, updateAssistant } from './updateAssistant';
import { AssistantEval, evaluate } from './evaluate';

/**
 *  The `AssistantCtrlPlane` class holds the control plane methods for interacting with
 *  [Assistants](https://docs.pinecone.io/guides/assistant/understanding-assistant). It additionally allows access
 *  to the [Evaluation service](https://docs.pinecone.io/guides/assistant/understanding-evaluation), which users use
 *  to evaluate questions against ground truth answers.
 *
 *  This class's methods are instantiated on a Pinecone object and accessed via the `assistant` property.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 *
 * // Create a new assistant:
 * await pc.assistant.createAssistant({name: 'test1'});
 *
 * // Evaluate a question:
 * await pc.assistant.evaluate({
 *     question: "What is the capital of France?",
 *     answer: "Lyon is France's capital city",
 *     groundTruth: "Paris is the capital city of France"
 * });
 * ```
 */
export class AssistantCtrlPlane {
  readonly _createAssistant?: ReturnType<typeof createAssistant>;
  readonly _deleteAssistant?: ReturnType<typeof deleteAssistant>;
  readonly _getAssistant?: ReturnType<typeof describeAssistant>;
  readonly _listAssistants?: ReturnType<typeof listAssistants>;
  readonly _updateAssistant?: ReturnType<typeof updateAssistant>;
  readonly evalApi?: MetricsApi;
  readonly _evaluate?: ReturnType<typeof evaluate>;

  private config: PineconeConfiguration;

  /**
   * Creates an instance of the `AssistantCtrlPlane` class.
   *
   * @param config - {@link PineconeConfiguration} object containing an API key and other configuration parameters
   * needed for API calls.
   * @param params - An object containing the optional `assistantApi` and `evalApi` parameters. If `assistantApi`
   * is passed, the class will be able to interact with the Assistant API. If `evalApi` is passed, the class will
   * be able to interact with the Evaluation API.
   */
  constructor(
    config: PineconeConfiguration,
    params: { assistantApi?: ManageAssistantsApiCtrl; evalApi?: MetricsApi }
  ) {
    this.config = config;
    if (params.evalApi) {
      this.evalApi = params.evalApi;
      this._evaluate = evaluate(this.evalApi);
    }
    if (params.assistantApi) {
      this._createAssistant = createAssistant(params.assistantApi);
      this._deleteAssistant = deleteAssistant(params.assistantApi);
      this._getAssistant = describeAssistant(params.assistantApi);
      this._listAssistants = listAssistants(params.assistantApi);
      this._updateAssistant = updateAssistant(params.assistantApi);
    }
  }

  /**
   * Creates a new Assistant.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistant.createAssistant({name: 'test1'});
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
   * @throws Error if the Assistant API is not initialized.
   * @throws Error if an invalid region is provided.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async createAssistant(options: CreateAssistantOptions) {
    if (!this._createAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    if (options.region) {
      let region: CreateAssistantRequestRegionEnum =
        CreateAssistantRequestRegionEnum.Us;
      if (
        !Object.values(CreateAssistantRequestRegionEnum)
          .toString()
          .includes(options.region.toLowerCase())
      ) {
        throw new Error(
          'Invalid region specified. Must be one of "us" or "eu"'
        );
      } else {
        region =
          options.region.toLowerCase() as CreateAssistantRequestRegionEnum;
      }
      //AssistantHostSingleton._set(this.config, options.name, region);
      options.region = region;
    }
    return await this._createAssistant(options);
  }

  /**
   * Deletes an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistant.deleteAssistant('test1');
   * ```
   *
   * @param assistantName - The name of the Assistant to be deleted.
   * @throws Error if the Assistant API is not initialized.
   */
  async deleteAssistant(assistantName: string) {
    if (!this._deleteAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._deleteAssistant(assistantName);
  }

  /**
   * Retrieves information about an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const test = await pc.assistant.getAssistant('test1');
   * console.log(test);
   * // {
   * //  name: 'test10',
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
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an {@link Assistant} model.
   */
  async getAssistant(assistantName: string) {
    if (!this._getAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._getAssistant(assistantName);
  }

  /**
   * Retrieves a list of all Assistants for a given Pinecone API key.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const assistants = await pc.assistant.listAssistants();
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
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an object containing an array of {@link Assistant} models.
   */
  async listAssistants() {
    if (!this._listAssistants) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._listAssistants();
  }

  /**
   * Updates an Assistant by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistant.updateAssistant({name: 'test1', instructions: 'some new  instructions!'});
   * // {
   * //  assistantName: test1,
   * //  instructions: 'some new instructions!',
   * //  metadata: undefined
   * // }
   * ```
   *
   * @param options - An {@link updateAssistant} object containing the name of the Assistant to be updated and
   * optional instructions and metadata.
   * @throws Error if the Assistant API is not initialized.
   * @returns A Promise that resolves to an {@link UpdateAssistant200Response} object.
   */
  async updateAssistant(options: UpdateAssistantOptions) {
    if (!this._updateAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._updateAssistant(options);
  }

  /**
   * Evaluates a question against a given answer and a ground truth answer.
   *
   * Note: The Evaluation API is currently spec-ed under the data plane API, but it lives here since you don't need
   * an `assistantName` to interact with it, as you do for the other data plane operations.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * await pc.assistant.evaluate({
   *    question: "What is the capital of France?",
   *    answer: "Lyon is France's capital city",
   *    groundTruth: "Paris is the capital city of France"
   *   });
   * // {
   * //  metrics: { correctness: 0, completeness: 0, alignment: 0 }, // 0s across the board indicates incorrect
   * //  reasoning: { evaluatedFacts: [ [Object] ] },
   * //  usage: { promptTokens: 1134, completionTokens: 21, totalTokens: 1155 }
   * // }
   * ```
   * @param options - An {@link AssistantEval} object containing the question, the answer, and a ground truth answer to
   * evaluate.
   * @throws Error if the Evaluation API is not initialized.
   * @returns A Promise that resolves to an {@link AlignmentResponse} object.
   */
  evaluate(options: AssistantEval) {
    if (!this._evaluate) {
      throw new Error('Evaluation API is not initialized');
    }
    return this._evaluate(options);
  }
}
