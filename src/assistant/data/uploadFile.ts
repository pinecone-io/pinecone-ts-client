import {
  AssistantFileModelFromJSON,
  X_PINECONE_API_VERSION,
  JSONApiResponse,
  ResponseError,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { handleApiError, PineconeArgumentError } from '../../errors';
import { PineconeConfiguration } from '../../data';
import { buildUserAgent, getFetch } from '../../utils';
import type { AssistantFileModel, UploadFileOptions } from './types';
import fs from 'fs';
import path from 'path';

export const uploadFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration
) => {
  return async (options: UploadFileOptions): Promise<AssistantFileModel> => {
    const fetch = getFetch(config);
    validateUploadFileOptions(options);

    const fileBuffer = fs.readFileSync(options.path);
    const fileName = path.basename(options.path);
    const mimeType = getMimeType(fileName);
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    const hostUrl = await apiProvider.provideHostUrl();
    let filesUrl = `${hostUrl}/files/${assistantName}`;

    const requestHeaders = {
      'Api-Key': config.apiKey,
      'User-Agent': buildUserAgent(config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
    };

    if (options.metadata) {
      const encodedMetadata = encodeURIComponent(
        JSON.stringify(options.metadata)
      );
      filesUrl += `?metadata=${encodedMetadata}`;
    }

    const response = await fetch(filesUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: formData,
    });

    if (response.ok) {
      const assistantFileModel = new JSONApiResponse(response, (jsonValue) =>
        AssistantFileModelFromJSON(jsonValue)
      ).value();
      return assistantFileModel;
    } else {
      const err = await handleApiError(
        new ResponseError(response, 'Response returned an error'),
        undefined,
        filesUrl
      );
      throw err;
    }
  };
};

const validateUploadFileOptions = (options: UploadFileOptions) => {
  if (!options || !options.path) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`path`) to upload a file.'
    );
  }
};

// get mime types for accepted file types
function getMimeType(filePath: string) {
  const extensionToMimeType = {
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  // Extract file extension and ensure it's lowercase
  const parts = filePath.split('.');
  if (parts.length < 2) {
    return 'application/octet-stream'; // Default for files without extensions
  }
  const ext = parts.pop();
  const extension = ext ? ext.toLowerCase() : '';

  // Return the MIME type or a default value for unsupported types
  return extensionToMimeType[extension];
}
