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
import fs from 'fs';
import path from 'path';

/**
 * The `UploadFile` interface describes the file path for uploading a file to an Assistant and optional metadata.
 */
export interface UploadFile {
  /**
   * The (local) path to the file to upload.
   */
  path: string;
  /**
   * Optional metadata to attach to the file.
   */
  metadata?: Record<string, string>;
}

export const uploadFileInternal = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration
) => {
  return async (req: UploadFile) => {
    const fetch = getFetch(config);
    if (!req.path) {
      throw new PineconeArgumentError('File path is required');
    }
    const fileBuffer = fs.readFileSync(req.path);
    const fileName = path.basename(req.path);
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

    if (req.metadata) {
      const encodedMetadata = encodeURIComponent(JSON.stringify(req.metadata));
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

// get mime types for accepted file types
function getMimeType(filePath: string) {
  const extensionToMimeType = {
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    md: 'text/markdown',
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
