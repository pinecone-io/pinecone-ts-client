import { ManageAssistantsApi as ManageAssistantsApiData } from '../../pinecone-generated-ts-fetch/assistant_data';
import { chatClosed, ChatRequest } from './chat';
import { ListFiles, listFilesClosed } from './listFiles';
import { DescribeFile, describeFileClosed } from './describeFile';
import { DeleteFile, deleteFileClosed } from './deleteFile';
import { UploadFile, uploadFileClosed } from './uploadFile';
import { PineconeConfiguration } from '../../data';
import { assistantDataOperationsBuilder } from './assistantOperationsProviderData';
import { Context, contextClosed } from './context';
import { chatCompletionClosed, ChatCompletionRequest } from './chatCompletion';

export class AssistantDataPlane {
  private config: PineconeConfiguration;

  readonly dataApi: ManageAssistantsApiData;
  readonly _chat: ReturnType<typeof chatClosed>;
  readonly _chatCompletions: ReturnType<typeof chatCompletionClosed>;
  readonly _listFiles: ReturnType<typeof listFilesClosed>;
  readonly _describeFile: ReturnType<typeof describeFileClosed>;
  readonly _uploadFile: ReturnType<typeof uploadFileClosed>;
  readonly _deleteFile: ReturnType<typeof deleteFileClosed>;
  readonly _context: ReturnType<typeof contextClosed>;

  assistantName: string;

  constructor(assistantName: string, config: PineconeConfiguration) {
    if (!assistantName) {
      throw new Error('No assistant name provided');
    }
    this.config = config;
    this.dataApi = assistantDataOperationsBuilder(this.config, assistantName);
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
}
