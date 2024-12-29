import { ManageAssistantsApi as ManageAssistantsApiData } from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';
import { DeleteFile, deleteFileClosed } from './deleteFile';
import { MetricsApi } from '../../pinecone-generated-ts-fetch/assistant_evaluation';
import { Eval, evaluateClosed } from './evaluate';
import { UploadFile, uploadFileClosed } from './uploadFile';
import { PineconeConfiguration } from '../../data';
import { assistantDataOperationsBuilder } from './assistantOperationsProviderData';
import { assistantEvalOperationsBuilder } from './assistantOperationsProviderEval';
import { Context, contextClosed } from './context';
import { chatCompletionClosed, ChatCompletionRequest } from './chatCompletion';

export class AssistantDataPlane {
  dataApi: ManageAssistantsApiData; // todo: should this be private?
  evalApi: MetricsApi; // todo: should this be private?
  assistantName: string;
  config: PineconeConfiguration;

  private _chat: ReturnType<typeof chatClosed>;
  private _chatCompletions: ReturnType<typeof chatCompletionClosed>;
  private _listFiles: ReturnType<typeof listFilesClosed>;
  private _describeFile: ReturnType<typeof describeFileClosed>;
  private _uploadFile: ReturnType<typeof uploadFileClosed>;
  private _deleteFile: ReturnType<typeof deleteFileClosed>;
  private _context: ReturnType<typeof contextClosed>;
  private _evaluate: ReturnType<typeof evaluateClosed>;

  constructor(assistantName: string, config: PineconeConfiguration) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }
    this.config = config;
    this.dataApi = assistantDataOperationsBuilder(this.config, assistantName);
    this.evalApi = assistantEvalOperationsBuilder(this.config);
    this.assistantName = assistantName;

    this._chat = chatClosed(this.assistantName, this.dataApi);
    this._chatCompletions = chatCompletionClosed(
      this.assistantName,
      this.dataApi
    );
    this._listFiles = listFilesClosed(this.assistantName, this.dataApi);
    this._describeFile = describeFileClosed(this.assistantName, this.dataApi);
    this._uploadFile = uploadFileClosed(this.assistantName, this.config);
    this._deleteFile = deleteFileClosed(this.assistantName, this.dataApi);
    this._context = contextClosed(this.assistantName, this.dataApi);
    this._evaluate = evaluateClosed(this.assistantName, this.evalApi);
  }

  // --------- Chat methods ---------
  chat(options: ChatRequest) {
    return this._chat(options);
  }

  chatCompletions(options: ChatCompletionRequest) {
    return this._chatCompletions(options);
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

  uploadFile(options: UploadFile) {
    return this._uploadFile(options);
  }

  deleteFile(options: DeleteFile) {
    return this._deleteFile(options);
  }

  context(options: Context) {
    return this._context(options);
  }

  // --------- Evaluation methods ---------
  evaluate(options: Eval) {
    return this._evaluate(options);
  }
}
