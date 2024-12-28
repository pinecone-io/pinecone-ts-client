import {
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { PineconeNotImplementedError } from '../../errors';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';
import { DeleteFile, deleteFileClosed } from './deleteFile';
import { Configuration, MetricsApi } from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import { Eval, evaluateClosed } from './evaluate';

export class AssistantDataPlane {
  dataApi: ManageAssistantsApiData;  // todo: should this be private?
  evalApi: MetricsApi;  // todo: should this be private?
  assistantName: string;

  private _chat: ReturnType<typeof chatClosed>;
  private _listFiles: ReturnType<typeof listFilesClosed>;
  private _describeFile: ReturnType<typeof describeFileClosed>;
  // private _uploadFile: ReturnType<typeof uploadFileClosed>;
  private _deleteFile: ReturnType<typeof deleteFileClosed>;
  private _evaluate: ReturnType<typeof evaluateClosed>;

  constructor(dataApi: ManageAssistantsApiData, evalApi: MetricsApi, assistantName: string
  ) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }
    this.dataApi = dataApi;
    this.evalApi = evalApi;
    this.assistantName = assistantName;
    this._chat = chatClosed(this.assistantName, dataApi);
    this._listFiles = listFilesClosed(this.assistantName, dataApi);
    this._describeFile = describeFileClosed(this.assistantName, dataApi);
    // this._uploadFile = uploadFileClosed(this.assistantName, api, this.config);
    this._deleteFile = deleteFileClosed(this.assistantName, dataApi);
    this._evaluate = evaluateClosed(this.assistantName, evalApi);
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

  evaluate(options: Eval) {
    return this._evaluate(options);
  }

  // uploadFile(options: UploadFile){
    // return this._uploadFile(options);
  // }

}