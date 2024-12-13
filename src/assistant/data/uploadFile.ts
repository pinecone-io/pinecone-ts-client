import {
  type AssistantFileModel,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { PineconeConfiguration } from '../../data';
import { buildUserAgent } from '../../utils';

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

    let url = `https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}`;

    if (options.metadata) {
      const encodedMetadata = encodeURIComponent(
        JSON.stringify(options.metadata)
      );
      url += `?metadata=${encodedMetadata}`;
    }
    return axios.post(url, form, reqHeaders);
  };
};
