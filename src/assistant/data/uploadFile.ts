import { OperationModel } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { PineconeArgumentError } from '../../errors';
import type { PineconeConfiguration } from '../../data';
import type { UploadFileOptions } from './types';
import { sendFileMultipart } from './fileUpload';

export const uploadFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration,
) => {
  return async (options: UploadFileOptions): Promise<OperationModel> => {
    validateUploadFileOptions(options);

    const hostUrl = await apiProvider.provideHostUrl();
    let filesUrl = `${hostUrl}/files/${assistantName}`;
    if (options.multimodal !== undefined) {
      filesUrl += `?multimodal=${options.multimodal}`;
    }

    return sendFileMultipart(
      'POST',
      filesUrl,
      options,
      config,
      options.metadata,
    );
  };
};

const validateUploadFileOptions = (options: UploadFileOptions) => {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`path` or `file` + `fileName`) to upload a file.',
    );
  }
  if (!('path' in options) && !('file' in options)) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`path` or `file` + `fileName`) to upload a file.',
    );
  }
  if ('path' in options && !options.path) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`path` or `file` + `fileName`) to upload a file.',
    );
  }
  if ('file' in options) {
    if (!options.file) {
      throw new PineconeArgumentError(
        'You must pass an object with required properties (`path` or `file` + `fileName`) to upload a file.',
      );
    }
    if (!options.fileName) {
      throw new PineconeArgumentError(
        '`fileName` is required when uploading via `file`.',
      );
    }
  }
};
