import {
  ManageAssistantsApi as ManageAssistantsApiData,
  // UploadFileRequest
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { PineconeNotImplementedError } from '../../errors';
// import { uploadFileClosed, UploadRequest } from './uploadFile';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';

export class AssistantDataPlane {
  api: ManageAssistantsApiData;  // todo: should this be private?
  assistantName: string;

  private _chat: ReturnType<typeof chatClosed>;
  private _listFiles: ReturnType<typeof listFilesClosed>;
  private _describeFile: ReturnType<typeof describeFileClosed>;

  // private _uploadFile: ReturnType<typeof uploadFileClosed>;

  constructor(api: ManageAssistantsApiData, assistantName: string) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }

    this.api = api;
    this.assistantName = assistantName;
    this._chat = chatClosed(this.assistantName, api);
    this._listFiles = listFilesClosed(this.assistantName, api);
    this._describeFile = describeFileClosed(this.assistantName, api);


    // this._uploadFile = uploadFileClosed(api);
  }

  // --------- Chat methods ---------
  chat(options: ChatRequest) {
    return this._chat(options);
  }

  chatCompletions() {
    return PineconeNotImplementedError;
  }

  // --------- File methods ---------
  listFiles(options?: ListFiles) {
    if (!options) {
      options = {};
    }
    return this._listFiles(options);
  }

  describeFile(options: DescribeFile) {
    return this._describeFile(options);
  }

  deleteFile(){
    return PineconeNotImplementedError;
  }

  // uploadFile(options: UploadRequest){
    // return this._uploadFile(options);
  // }

}