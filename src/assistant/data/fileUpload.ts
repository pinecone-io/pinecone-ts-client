import {
  OperationModel,
  OperationModelFromJSON,
  X_PINECONE_API_VERSION,
  JSONApiResponse,
  ResponseError,
} from '../../pinecone-generated-ts-fetch/assistant_data';
import { handleApiError } from '../../errors';
import type { PineconeConfiguration } from '../../data';
import { buildUserAgent, getFetch, getNonRetryingFetch } from '../../utils';
import type { Uploadable } from './types';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * The file content portion of a multipart upload. Provide either `path` (a
 * local file path) or `file` + `fileName` (an in-memory buffer, blob, or
 * readable stream).
 */
export interface FileMultipartInput {
  path?: string;
  file?: Uploadable;
  fileName?: string;
}

/**
 * Sends a file to an assistant as a `multipart/form-data` request and parses
 * the response into an {@link OperationModel}.
 *
 * Shared by {@link uploadFile} (`POST /files/{assistant_name}`) and
 * {@link upsertFile} (`PUT /files/{assistant_name}/{assistant_file_id}`). The
 * caller is responsible for building the target `url` (including any query
 * params such as `multimodal`).
 *
 * `Blob` and `Buffer` inputs are replayable, so they use the retrying fetch.
 * `ReadableStream` inputs are streamed in a single attempt with no retries
 * because the stream is consumed on first read and cannot be replayed.
 *
 * @param method - The HTTP method to use (`POST` for upload, `PUT` for upsert).
 * @param url - The fully-built request URL.
 * @param input - The file content to send.
 * @param config - The Pinecone configuration object.
 * @param metadata - Optional metadata to attach to the file. Not all endpoints
 *   accept metadata; callers that don't support it should omit this argument.
 */
export async function sendFileMultipart(
  method: 'POST' | 'PUT',
  url: string,
  input: FileMultipartInput,
  config: PineconeConfiguration,
  metadata?: Record<string, string | number>,
): Promise<OperationModel> {
  const requestHeaders = buildRequestHeaders(config);

  if (input.path) {
    return uploadFromPath(
      method,
      input.path,
      url,
      requestHeaders,
      config,
      metadata,
    );
  }
  return uploadFromFile(
    method,
    input.file!,
    input.fileName!,
    url,
    requestHeaders,
    config,
    metadata,
  );
}

// --- Path-based upload (async read → Blob → FormData, retries supported) ---

async function uploadFromPath(
  method: 'POST' | 'PUT',
  filePath: string,
  url: string,
  requestHeaders: Record<string, string>,
  config: PineconeConfiguration,
  metadata?: Record<string, string | number>,
): Promise<OperationModel> {
  const fetch = getFetch(config);
  const fileBuffer = await fs.promises.readFile(filePath);
  const fileName = path.basename(filePath);
  const mimeType = getMimeType(fileName);
  const fileBlob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', fileBlob, fileName);
  if (metadata) {
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
  }

  return executeUpload(fetch, method, url, requestHeaders, formData);
}

// --- File/stream/buffer upload ---

async function uploadFromFile(
  method: 'POST' | 'PUT',
  file: Uploadable,
  fileName: string,
  url: string,
  requestHeaders: Record<string, string>,
  config: PineconeConfiguration,
  metadata?: Record<string, string | number>,
): Promise<OperationModel> {
  const mimeType = getMimeType(fileName);

  if (file instanceof Blob) {
    // Blob is replayable — retries are safe
    const fetch = getFetch(config);
    const formData = new FormData();
    formData.append('file', file, fileName);
    if (metadata) {
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
      );
    }
    return executeUpload(fetch, method, url, requestHeaders, formData);
  }

  if (Buffer.isBuffer(file)) {
    // Buffer is replayable — wrap in Blob and use retrying fetch.
    // Extract the exact ArrayBuffer slice to satisfy BlobPart's
    // ArrayBufferView<ArrayBuffer> constraint (Buffer uses ArrayBufferLike).
    const fetch = getFetch(config);
    const fileBlob = new Blob(
      [
        file.buffer.slice(
          file.byteOffset,
          file.byteOffset + file.byteLength,
        ) as ArrayBuffer,
      ],
      { type: mimeType },
    );
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    if (metadata) {
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
      );
    }
    return executeUpload(fetch, method, url, requestHeaders, formData);
  }

  // Node.js ReadableStream — stream is consumed on first read, no retries
  const fetch = getNonRetryingFetch(config);
  const { body, contentType } = buildMultipartBody(
    file,
    fileName,
    mimeType,
    metadata,
  );
  return executeStreamUpload(
    fetch,
    method,
    url,
    requestHeaders,
    body,
    contentType,
  );
}

// --- Shared response handling ---

async function executeUpload(
  fetch: ReturnType<typeof getFetch>,
  method: 'POST' | 'PUT',
  url: string,
  requestHeaders: Record<string, string>,
  body: FormData,
): Promise<OperationModel> {
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
  });
  return parseResponse(response, url);
}

async function executeStreamUpload(
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  method: 'POST' | 'PUT',
  url: string,
  requestHeaders: Record<string, string>,
  body: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<OperationModel> {
  const response = await fetch(url, {
    method,
    headers: { ...requestHeaders, 'Content-Type': contentType },
    body,
    // undici (Node.js built-in fetch) requires duplex: 'half' for streaming
    // request bodies. The RequestInit type doesn't include this field yet.
    ...({ duplex: 'half' } as RequestInit),
  });
  return parseResponse(response, url);
}

async function parseResponse(
  response: Response,
  url: string,
): Promise<OperationModel> {
  if (response.ok) {
    return await new JSONApiResponse(response, (jsonValue) =>
      OperationModelFromJSON(jsonValue),
    ).value();
  } else {
    const err = await handleApiError(
      new ResponseError(response, 'Response returned an error'),
      undefined,
      url,
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
  metadata?: Record<string, string | number>,
): { body: ReadableStream<Uint8Array>; contentType: string } {
  const boundary = `----PineconeBoundary${Math.random().toString(36).slice(2)}`;
  const encoder = new TextEncoder();

  const preambleParts: Uint8Array[] = [];
  if (metadata) {
    preambleParts.push(
      encoder.encode(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="metadata"\r\n` +
          `Content-Type: application/json\r\n` +
          `\r\n` +
          JSON.stringify(metadata) +
          `\r\n`,
      ),
    );
  }
  preambleParts.push(
    encoder.encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${escapeFilename(fileName)}"\r\n` +
        `Content-Type: ${mimeType}\r\n` +
        `\r\n`,
    ),
  );

  const totalLength = preambleParts.reduce((sum, p) => sum + p.length, 0);
  const header = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of preambleParts) {
    header.set(part, offset);
    offset += part.length;
  }

  const footer = encoder.encode(`\r\n--${boundary}--\r\n`);

  // Convert Node.js ReadableStream to Web ReadableStream
  const webStream = Readable.toWeb(
    stream instanceof Readable ? stream : Readable.from(stream),
  ) as ReadableStream<Uint8Array>;

  const reader = webStream.getReader();
  let phase: 'header' | 'body' | 'done' = 'header';

  // Use pull (not start) so chunks are read on demand as fetch consumes the
  // body. start runs eagerly and enqueue() ignores backpressure, which would
  // buffer the entire stream in the internal queue before upload begins.
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (phase === 'header') {
        controller.enqueue(header);
        phase = 'body';
        return;
      }

      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(footer);
        controller.close();
        phase = 'done';
      } else {
        controller.enqueue(value);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

// --- Helpers ---

function buildRequestHeaders(
  config: PineconeConfiguration,
): Record<string, string> {
  return {
    'Api-Key': config.apiKey,
    'User-Agent': buildUserAgent(config),
    'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
  };
}

// Per RFC 7578 §2 (https://www.rfc-editor.org/rfc/rfc7578#section-2),
// double quotes, carriage returns, and newlines must be percent-encoded
// in the filename parameter of a Content-Disposition header.
function escapeFilename(fileName: string): string {
  return fileName
    .replace(/"/g, '%22')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

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
