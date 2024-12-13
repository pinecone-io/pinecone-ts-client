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
  metadata?: { key: string; value: string } | { key: string; value: string }[];
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

    if (options.metadata) {
      if (Array.isArray(options.metadata)) {
        // If metadata is an array of key-value pairs
        options.metadata.forEach(({ key, value }) => {
          form.append(key, value);
        });
      } else {
        // If metadata is a single key-value pair
        const { key, value } = options.metadata;
        form.append(key, value);
      }
    }

    return axios.post(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          ...(config.additionalHeaders || null),
          'Api-Key': config.apiKey,
          'User-Agent': buildUserAgent(config),
          'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
        },
      }
    );
  };
};
