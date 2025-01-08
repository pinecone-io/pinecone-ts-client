import {
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsApiCtrl,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import { MetricsApi } from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import { AssistantHostSingleton } from '../assistantHostSingleton';
import { PineconeConfiguration } from '../../data';
import {
  createAssistantClosed,
  createAssistantRequest,
} from './createAssistant';
import { deleteAssistantClosed } from './deleteAssistant';
import { getAssistantClosed } from './getAssistant';
import { listAssistantsClosed } from './listAssistants';
import { updateAssistant, updateAssistantClosed } from './updateAssistant';
import { Eval, evaluateClosed } from './evaluate';

export class AssistantCtrlPlane {
  readonly _createAssistant?: ReturnType<typeof createAssistantClosed>;
  readonly _deleteAssistant?: ReturnType<typeof deleteAssistantClosed>;
  readonly _getAssistant?: ReturnType<typeof getAssistantClosed>;
  readonly _listAssistants?: ReturnType<typeof listAssistantsClosed>;
  readonly _updateAssistant?: ReturnType<typeof updateAssistantClosed>;
  readonly evalApi?: MetricsApi;
  readonly _evaluate?: ReturnType<typeof evaluateClosed>;

  private config: PineconeConfiguration;

  constructor(
    config: PineconeConfiguration,
    params: { assistantApi?: ManageAssistantsApiCtrl; evalApi?: MetricsApi }
  ) {
    this.config = config;
    if (params.evalApi) {
      this.evalApi = params.evalApi;
      this._evaluate = evaluateClosed(this.evalApi);
    }
    if (params.assistantApi) {
      this._createAssistant = createAssistantClosed(params.assistantApi);
      this._deleteAssistant = deleteAssistantClosed(params.assistantApi);
      this._getAssistant = getAssistantClosed(params.assistantApi);
      this._listAssistants = listAssistantsClosed(params.assistantApi);
      this._updateAssistant = updateAssistantClosed(params.assistantApi);
    }
  }

  async createAssistant(options: createAssistantRequest) {
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
      AssistantHostSingleton._set(this.config, options.name, region);
      options.region = region;
    }
    return await this._createAssistant(options);
  }

  async deleteAssistant(assistantName: string) {
    if (!this._deleteAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._deleteAssistant(assistantName);
  }

  async getAssistant(assistantName: string) {
    if (!this._getAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._getAssistant(assistantName);
  }

  async listAssistants() {
    if (!this._listAssistants) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._listAssistants();
  }

  async updateAssistant(options: updateAssistant) {
    if (!this._updateAssistant) {
      throw new Error('Assistant API is not initialized');
    }
    return await this._updateAssistant(options);
  }

  // Eval is currently spec-d to be on the data plane, but it lives here since you don't need an assistantName to
  // access it, as you do for the other data plane operations
  evaluate(options: Eval) {
    if (!this._evaluate) {
      throw new Error('Evaluation API is not initialized');
    }
    return this._evaluate(options);
  }
}
