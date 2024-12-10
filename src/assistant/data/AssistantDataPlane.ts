import {
  ManageAssistantsApi as ManageAssistantsApiData, UploadFileRequest
  // UploadFileRequest
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { PineconeNotImplementedError } from '../../errors';
// import { uploadFileClosed, UploadRequest } from './uploadFile';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';
import { UploadFile, uploadFileClosed } from './uploadFile';
import { DeleteFile, deleteFileClosed } from './deleteFile';

export class AssistantDataPlane {
  api: ManageAssistantsApiData;  // todo: should this be private?
  assistantName: string;

  private _chat: ReturnType<typeof chatClosed>;
  private _listFiles: ReturnType<typeof listFilesClosed>;
  private _describeFile: ReturnType<typeof describeFileClosed>;
  private _uploadFile: ReturnType<typeof uploadFileClosed>;
  private _deleteFile: ReturnType<typeof deleteFileClosed>;


  constructor(api: ManageAssistantsApiData, assistantName: string) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }

    this.api = api;
    this.assistantName = assistantName;
    this._chat = chatClosed(this.assistantName, api);
    this._listFiles = listFilesClosed(this.assistantName, api);
    this._describeFile = describeFileClosed(this.assistantName, api);
    this._uploadFile = uploadFileClosed(this.assistantName, api);
    this._deleteFile = deleteFileClosed(this.assistantName, api);

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

  deleteFile(options: DeleteFile){
    return this._deleteFile(options);
  }

  uploadFile(options: UploadFileRequest){
    return this._uploadFile(options);
  }

}