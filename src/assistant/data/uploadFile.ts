import {
  AssistantFileModel,
  AssistantFileModelFromJSON,
  X_PINECONE_API_VERSION,
  JSONApiResponse,
  ResponseError,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from './asstDataOperationsProvider';
import { handleApiError, PineconeArgumentError } from '../../errors';
import type { PineconeConfiguration } from '../../data';
import { buildUserAgent, getFetch, getNonRetryingFetch } from '../../utils';
import type { UploadFileOptions, Uploadable } from './types';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const uploadFile = (
  assistantName: string,
  apiProvider: AsstDataOperationsProvider,
  config: PineconeConfiguration,
) => {
  return async (options: UploadFileOptions): Promise<AssistantFileModel> => {
    validateUploadFileOptions(options);

    const hostUrl = await apiProvider.provideHostUrl();
    const filesUrl = buildFilesUrl(hostUrl, assistantName, options);
    const requestHeaders = buildRequestHeaders(config);

    if ('path' in options && options.path) {
      return uploadFromPath(options.path, filesUrl, requestHeaders, config);
    } else {
      return uploadFromFile(
        options.file!,
        options.fileName!,
        filesUrl,
        requestHeaders,
        config,
      );
    }
  };
};

// --- Path-based upload (async read → Blob → FormData, retries supported) ---

async function uploadFromPath(
  filePath: string,
  filesUrl: string,
  requestHeaders: Record<string, string>,
  config: PineconeConfiguration,
): Promise<AssistantFileModel> {
  const fetch = getFetch(config);
  const fileBuffer = await fs.promises.readFile(filePath);
  const fileName = path.basename(filePath);
  const mimeType = getMimeType(fileName);
  const fileBlob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', fileBlob, fileName);

  return executeUpload(fetch, filesUrl, requestHeaders, formData);
}

// --- File/stream/buffer upload ---

async function uploadFromFile(
  file: Uploadable,
  fileName: string,
  filesUrl: string,
  requestHeaders: Record<string, string>,
  config: PineconeConfiguration,
): Promise<AssistantFileModel> {
  const mimeType = getMimeType(fileName);

  if (file instanceof Blob) {
    // Blob is replayable — retries are safe
    const fetch = getFetch(config);
    const formData = new FormData();
    formData.append('file', file, fileName);
    return executeUpload(fetch, filesUrl, requestHeaders, formData);
  }

  if (Buffer.isBuffer(file)) {
    // Buffer is replayable — wrap in Blob and use retrying fetch
    const fetch = getFetch(config);
    const fileBlob = new Blob([file], { type: mimeType });
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    return executeUpload(fetch, filesUrl, requestHeaders, formData);
  }

  // Node.js ReadableStream — stream is consumed on first read, no retries
  const fetch = getNonRetryingFetch(config);
  const { body, contentType } = buildMultipartBody(file, fileName, mimeType);
  return executeStreamUpload(
    fetch,
    filesUrl,
    requestHeaders,
    body,
    contentType,
  );
}

// --- Shared response handling ---

async function executeUpload(
  fetch: ReturnType<typeof getFetch>,
  filesUrl: string,
  requestHeaders: Record<string, string>,
  body: FormData,
): Promise<AssistantFileModel> {
  const response = await fetch(filesUrl, {
    method: 'POST',
    headers: requestHeaders,
    body,
  });
  return parseResponse(response, filesUrl);
}

async function executeStreamUpload(
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  filesUrl: string,
  requestHeaders: Record<string, string>,
  body: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<AssistantFileModel> {
  const response = await fetch(filesUrl, {
    method: 'POST',
    headers: { ...requestHeaders, 'Content-Type': contentType },
    body,
    // undici (Node.js built-in fetch) requires duplex: 'half' for streaming
    // request bodies. The RequestInit type doesn't include this field yet.
    ...({ duplex: 'half' } as unknown as RequestInit),
  });
  return parseResponse(response, filesUrl);
}

async function parseResponse(
  response: Response,
  filesUrl: string,
): Promise<AssistantFileModel> {
  if (response.ok) {
    return await new JSONApiResponse(response, (jsonValue) =>
      AssistantFileModelFromJSON(jsonValue),
    ).value();
  } else {
    const err = await handleApiError(
      new ResponseError(response, 'Response returned an error'),
      undefined,
      filesUrl,
    );
    throw err;
  }
}

// --- Streaming multipart body construction ---

/**
 * Builds a multipart/form-data body as a streaming ReadableStream without
 * buffering the file content. The returned body and contentType header should
 * be passed directly to fetch().
 */
function buildMultipartBody(
  stream: NodeJS.ReadableStream,
  fileName: string,
  mimeType: string,
): { body: ReadableStream<Uint8Array>; contentType: string } {
  const boundary = `----PineconeBoundary${Math.random().toString(36).slice(2)}`;
  const encoder = new TextEncoder();

  const header = encoder.encode(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: ${mimeType}\r\n` +
      `\r\n`,
  );
  const footer = encoder.encode(`\r\n--${boundary}--\r\n`);

  // Convert Node.js ReadableStream to Web ReadableStream
  const webStream = Readable.toWeb(
    stream instanceof Readable ? stream : Readable.from(stream),
  ) as ReadableStream<Uint8Array>;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(header);

      const reader = webStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
      }

      controller.enqueue(footer);
      controller.close();
    },
  });

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

// --- Helpers ---

function buildFilesUrl(
  hostUrl: string,
  assistantName: string,
  options: UploadFileOptions,
): string {
  let filesUrl = `${hostUrl}/files/${assistantName}`;

  if (options.metadata) {
    const encodedMetadata = encodeURIComponent(
      JSON.stringify(options.metadata),
    );
    filesUrl += `?metadata=${encodedMetadata}`;
  }

  if (options.multimodal !== undefined) {
    const separator = filesUrl.includes('?') ? '&' : '?';
    filesUrl += `${separator}multimodal=${options.multimodal}`;
  }

  return filesUrl;
}

function buildRequestHeaders(
  config: PineconeConfiguration,
): Record<string, string> {
  return {
    'Api-Key': config.apiKey,
    'User-Agent': buildUserAgent(config),
    'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
  };
}

const validateUploadFileOptions = (options: UploadFileOptions) => {
  if (!options) {
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

// get mime types for accepted file types
function getMimeType(filePath: string) {
  const extensionToMimeType: Record<string, string> = {
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  const parts = filePath.split('.');
  if (parts.length < 2) {
    return 'application/octet-stream';
  }
  const ext = parts.pop();
  const extension = ext ? ext.toLowerCase() : '';

  return extensionToMimeType[extension] ?? 'application/octet-stream';
}
