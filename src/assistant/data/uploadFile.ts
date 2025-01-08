import {
  type AssistantFileModel,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { PineconeConfiguration } from '../../data';
import { buildUserAgent } from '../../utils';
import { AssistantHostSingleton } from '../assistantHostSingleton';

export interface UploadFile {
  path: string;
  metadata?: Record<string, string>;
}

export const uploadFileClosed = (
  assistantName: string,
  config: PineconeConfiguration
) => {
  return async (options: UploadFile): Promise<AssistantFileModel> => {
    if (!options.path) {
      throw new Error('File path is required in the options.');
    }

    const filePath = options.path;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const reqHeaders = {
      headers: {
        ...form.getHeaders(),
        ...(config.additionalHeaders || null),
        'Api-Key': config.apiKey,
        'User-Agent': buildUserAgent(config),
        'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
      },
    };

    const hostUrl = AssistantHostSingleton.getHostUrl(config, assistantName);
    let url = `${hostUrl}/files/${assistantName}`;

    if (options.metadata) {
      const encodedMetadata = encodeURIComponent(
        JSON.stringify(options.metadata)
      );
      url += `?metadata=${encodedMetadata}`;
    }
    const resp = await axios.post(url, form, reqHeaders);

    return {
      name: resp.data.name,
      id: resp.data.id,
      metadata: resp.data.metadata || null,
      createdOn: new Date(resp.data.createdOn),
      updatedOn: new Date(resp.data.updatedOn),
      status: resp.data.status,
      percentDone: resp.data.percentDone || null,
      signedUrl: resp.data.signedUrl || null,
      errorMessage: resp.data.errorMessage || null,
    } as AssistantFileModel;
  };
};
