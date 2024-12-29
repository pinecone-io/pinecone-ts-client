import {
  CreateAssistantRequest,
  ManageAssistantsApi as ManageAssistantsApiCtrl,
  UpdateAssistantOperationRequest,
  UpdateAssistantRequest,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import {
  createAssistantClosed,
  deleteAssistantClosed,
  getAssistantClosed,
  listAssistantsClosed,
  updateAssistantClosed,
} from './index';
import { AssistantHostSingleton } from './assistantHostSingleton';
import { PineconeConfiguration } from '../../data';

export class AssistantCtrlPlane {
  _createAssistant: ReturnType<typeof createAssistantClosed>;
  _deleteAssistant: ReturnType<typeof deleteAssistantClosed>;
  _getAssistant: ReturnType<typeof getAssistantClosed>;
  _listAssistants: ReturnType<typeof listAssistantsClosed>;
  _updateAssistant: ReturnType<typeof updateAssistantClosed>;
  private config: PineconeConfiguration;

  constructor(api: ManageAssistantsApiCtrl, config: PineconeConfiguration) {
    this.config = config;
    this._createAssistant = createAssistantClosed(api);
    this._deleteAssistant = deleteAssistantClosed(api);
    this._getAssistant = getAssistantClosed(api);
    this._listAssistants = listAssistantsClosed(api);
    this._updateAssistant = updateAssistantClosed(api);
  }

  async createAssistant(options: CreateAssistantRequest) {
    const response = await this._createAssistant(options);
    if (options.region) {
      AssistantHostSingleton._set(this.config, options.name, options.region);
    }
    return response;
  }

  async deleteAssistant(assistantName: string) {
    return await this._deleteAssistant(assistantName);
  }

  async getAssistant(assistantName: string) {
    return await this._getAssistant(assistantName);
  }

  async listAssistants() {
    return await this._listAssistants();
  }

  async updateAssistant(
    options: UpdateAssistantOperationRequest & UpdateAssistantRequest
  ) {
    return await this._updateAssistant(options);
  }
}
