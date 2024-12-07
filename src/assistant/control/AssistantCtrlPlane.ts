import {
  CreateAssistantRequest,
  ManageAssistantsApi as ManageAssistantsApiCtrl, UpdateAssistantOperationRequest, UpdateAssistantRequest
} from '../../pinecone-generated-ts-fetch/assistant_control';
import { createAssistantClosed } from './index';
import { deleteAssistantClosed } from './index';
import { getAssistantClosed } from './index';
import { listAssistantsClosed } from './index';
import { updateAssistantClosed } from './index';

export class AssistantCtrlPlane {
  _createAssistant: ReturnType<typeof createAssistantClosed>;
  _deleteAssistant: ReturnType<typeof deleteAssistantClosed>;
  _getAssistant: ReturnType<typeof getAssistantClosed>;
  _listAssistants: ReturnType<typeof listAssistantsClosed>;
  _updateAssistant: ReturnType<typeof updateAssistantClosed>;

  constructor(api: ManageAssistantsApiCtrl) {
    this._createAssistant = createAssistantClosed(api)
    this._deleteAssistant = deleteAssistantClosed(api)
    this._getAssistant = getAssistantClosed(api)
    this._listAssistants = listAssistantsClosed(api)
    this._updateAssistant = updateAssistantClosed(api)
  }

  createAssistant(options: CreateAssistantRequest) {
      return this._createAssistant(options);
    } // todo: should this be async?

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
