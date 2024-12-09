import {
  ManageAssistantsApi as ManageAssistantsApiData, UploadFileRequest
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { PineconeNotImplementedError } from '../../errors';
import { uploadFileClosed, UploadRequest } from './uploadFile';

export class AssistantDataPlane {
  api: ManageAssistantsApiData;  // todo: should this be private?
  assistantName: string;

  // private _chat: ReturnType<typeof chatClosed>;
  private _uploadFile: ReturnType<typeof uploadFileClosed>;
  private _chat: ReturnType<typeof chatClosed>;

  constructor(api: ManageAssistantsApiData, assistantName: string) {
    this.api = api;
    this.assistantName = assistantName;
    this._chat = chatClosed(this.assistantName, api);
    this._uploadFile = uploadFileClosed(api);
  }

  // --------- Chat methods ---------
  chat(options: ChatRequest) {
    return this._chat(options);
  }

  chatCompletions() {
    return PineconeNotImplementedError;
  }

  // --------- File methods ---------
  listFiles() {
    return PineconeNotImplementedError;
  }

  describeFile(){
    return PineconeNotImplementedError;
  }

  deleteFile(){
    return PineconeNotImplementedError;
  }

  uploadFile(options: UploadRequest){
    // return this._uploadFile(options);
  }

}