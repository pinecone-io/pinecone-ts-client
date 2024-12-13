import {
  DescribeFileRequest,
  ManageAssistantsApi as ManageAssistantsApiData,
} from '../../pinecone-generated-ts-fetch/assistant_data';

export interface DescribeFile {
  fileId: string;
  includeUrl?: boolean;
}

export const describeFileClosed = (
  assistantName: string,
  api: ManageAssistantsApiData
) => {
  return async (options: DescribeFile) => {
    const request = {
      assistantName: assistantName,
      assistantFileId: options.fileId,
      includeUrl: options.includeUrl,
    } as DescribeFileRequest;
    return api.describeFile(request);
  };
};
