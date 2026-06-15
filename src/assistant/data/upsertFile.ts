import { OperationModel } from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { PineconeArgumentError } from '../../errors';
import type { PineconeConfiguration } from '../../data';
import type { UpsertFileOptions } from './types';
import { sendFileMultipart } from './fileUpload';

/**
 * Creates or replaces a file on an Assistant at a caller-supplied file ID.
 *
 * If a file with the given `assistantFileId` already exists, its content is
 * replaced; if it does not exist, a new file is created with that identifier.
 * This makes upsert idempotent by ID — useful when you own the ID space (for
 * example, mirroring your own document IDs into the assistant or re-syncing a
 * changed source document to the same ID).
 *
 * Contrast with {@link uploadFile}, which always creates a new file with a
 * server-generated ID. Unlike `uploadFile`, upsert does *not* accept metadata.
 *
 * Accepts the same file inputs as {@link uploadFile} — a local file path or an
 * in-memory `Buffer`, `Blob`, or Node.js `ReadableStream`. Like upload, this
 * is an asynchronous operation: the returned {@link OperationModel} can be
 * polled for completion via `describeOperation`.
 *
 * @param assistantName - The name of the Assistant that owns the file.
 * @param apiProvider - The data plane operations provider.
 * @param config - The Pinecone configuration object.
 */
export const upsertFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration,
) => {
  return async (options: UpsertFileOptions): Promise<OperationModel> => {
    validateUpsertFileOptions(options);

    const hostUrl = await apiProvider.provideHostUrl();
    // Encode path segments — assistantFileId is caller-owned and may contain
    // characters (/, ?, #, %, ...) that would otherwise corrupt the URL path.
    let filesUrl = `${hostUrl}/files/${encodeURIComponent(
      assistantName,
    )}/${encodeURIComponent(options.assistantFileId)}`;
    if (options.multimodal !== undefined) {
      filesUrl += `?multimodal=${options.multimodal}`;
    }

    return sendFileMultipart('PUT', filesUrl, options, config);
  };
};

const validateUpsertFileOptions = (options: UpsertFileOptions) => {
  if (!options) {
    throw new PineconeArgumentError(
      'You must pass an object with required properties (`assistantFileId` and `path` or `file` + `fileName`) to upsert a file.',
    );
  }
  if (!options.assistantFileId) {
    throw new PineconeArgumentError(
      'You must pass the `assistantFileId` of the file to upsert.',
    );
  }
  if (!('path' in options) && !('file' in options)) {
    throw new PineconeArgumentError(
      'You must pass either `path` or `file` + `fileName` to upsert a file.',
    );
  }
  if ('path' in options && !options.path) {
    throw new PineconeArgumentError(
      'You must pass either `path` or `file` + `fileName` to upsert a file.',
    );
  }
  if ('file' in options) {
    if (!options.file) {
      throw new PineconeArgumentError(
        'You must pass either `path` or `file` + `fileName` to upsert a file.',
      );
    }
    if (!options.fileName) {
      throw new PineconeArgumentError(
        '`fileName` is required when upserting via `file`.',
      );
    }
  }
};
