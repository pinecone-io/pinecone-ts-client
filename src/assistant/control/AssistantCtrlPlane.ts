import {
  CreateAssistantRequestRegionEnum,
  ManageAssistantsApi as ManageAssistantsApiCtrl,
  UpdateAssistantOperationRequest,
  UpdateAssistantRequest,
} from '../../pinecone-generated-ts-fetch/assistant_control';
import { AssistantHostSingleton } from './assistantHostSingleton';
import { PineconeConfiguration } from '../../data';
import {
  createAssistantClosed,
  createAssistantRequest,
} from './createAssistant';
import { deleteAssistantClosed } from './deleteAssistant';
import { getAssistantClosed } from './getAssistant';
import { listAssistantsClosed } from './listAssistants';
import { updateAssistant, updateAssistantClosed } from './updateAssistant';

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

  async createAssistant(options: createAssistantRequest) {
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
    return await this._deleteAssistant(assistantName);
  }

  async getAssistant(assistantName: string) {
    return await this._getAssistant(assistantName);
  }

  async listAssistants() {
    return await this._listAssistants();
  }

  async updateAssistant(options: updateAssistant) {
    return await this._updateAssistant(options);
  }
}
