import { extractMessage } from '../utils';
import {
  mapHttpStatusError,
  PineconeBadRequestError,
  PineconeAuthorizationError,
  PineconeNotFoundError,
  PineconeMethodNotAllowedError,
  PineconeConflictError,
  PineconeInternalServerError,
  PineconeNotImplementedError,
  PineconeUnavailableError,
  PineconeUnmappedHttpError,
} from '../http';
import { handleApiError } from '../handling';
import { PineconeConnectionError } from '../request';
import { BasePineconeError } from '../base';
import { ResponseError } from '../../pinecone-generated-ts-fetch/db_control/runtime';

const buildResponseError = (
  status: number,
  body: string,
  url = 'https://api.pinecone.io/test',
): ResponseError => {
  const response = new Response(body, { status });
  Object.defineProperty(response, 'url', { value: url });
  return new ResponseError(response, 'Response returned an error');
};

describe('extractMessage', () => {
  test('returns raw text when response body is plain text', async () => {
    const error = buildResponseError(400, 'Something went wrong');
    const msg = await extractMessage(error);
    expect(msg).toBe('Something went wrong');
  });

  test('extracts message field from JSON body', async () => {
    const body = JSON.stringify({ message: 'Index quota exceeded' });
    const error = buildResponseError(400, body);
    const msg = await extractMessage(error);
    expect(msg).toBe('Index quota exceeded');
  });

  test('returns raw JSON string when JSON body has no message field', async () => {
    const body = JSON.stringify({ code: 'QUOTA_EXCEEDED' });
    const error = buildResponseError(400, body);
    const msg = await extractMessage(error);
    expect(msg).toBe(body);
  });

  test('returns raw text when body is malformed JSON', async () => {
    const body = '{not valid json}';
    const error = buildResponseError(400, body);
    const msg = await extractMessage(error);
    expect(msg).toBe(body);
  });
});

describe('mapHttpStatusError', () => {
  const url = 'https://api.pinecone.io/test';

  test('400 → PineconeBadRequestError', () => {
    const err = mapHttpStatusError({ status: 400, url, message: 'bad input' });
    expect(err).toBeInstanceOf(PineconeBadRequestError);
    expect(err.name).toBe('PineconeBadRequestError');
  });

  test('401 → PineconeAuthorizationError', () => {
    const err = mapHttpStatusError({ status: 401, url });
    expect(err).toBeInstanceOf(PineconeAuthorizationError);
    expect(err.name).toBe('PineconeAuthorizationError');
    expect(err.message).toContain(url);
  });

  test('403 → PineconeBadRequestError', () => {
    const err = mapHttpStatusError({ status: 403, url, message: 'forbidden' });
    expect(err).toBeInstanceOf(PineconeBadRequestError);
  });

  test('404 → PineconeNotFoundError', () => {
    const err = mapHttpStatusError({ status: 404, url });
    expect(err).toBeInstanceOf(PineconeNotFoundError);
    expect(err.name).toBe('PineconeNotFoundError');
    expect(err.message).toContain(url);
  });

  test('405 → PineconeMethodNotAllowedError', () => {
    const err = mapHttpStatusError({ status: 405, url });
    expect(err).toBeInstanceOf(PineconeMethodNotAllowedError);
    expect(err.name).toBe('PineconeMethodNotAllowedError');
    expect(err.message).toContain('405');
    expect(err.message).toContain(url);
  });

  test('405 without url still produces PineconeMethodNotAllowedError', () => {
    const err = mapHttpStatusError({ status: 405 });
    expect(err).toBeInstanceOf(PineconeMethodNotAllowedError);
    expect(err.message).toContain('not allowed');
  });

  test('409 → PineconeConflictError', () => {
    const err = mapHttpStatusError({ status: 409, url });
    expect(err).toBeInstanceOf(PineconeConflictError);
    expect(err.name).toBe('PineconeConflictError');
  });

  test('500 → PineconeInternalServerError', () => {
    const err = mapHttpStatusError({ status: 500, url });
    expect(err).toBeInstanceOf(PineconeInternalServerError);
    expect(err.name).toBe('PineconeInternalServerError');
  });

  test('501 → PineconeNotImplementedError', () => {
    const err = mapHttpStatusError({ status: 501, url });
    expect(err).toBeInstanceOf(PineconeNotImplementedError);
    expect(err.name).toBe('PineconeNotImplementedError');
  });

  test('503 → PineconeUnavailableError', () => {
    const err = mapHttpStatusError({ status: 503, url });
    expect(err).toBeInstanceOf(PineconeUnavailableError);
    expect(err.name).toBe('PineconeUnavailableError');
  });

  test('unmapped status throws PineconeUnmappedHttpError', () => {
    expect(() => mapHttpStatusError({ status: 418, url })).toThrow(
      PineconeUnmappedHttpError,
    );
  });

  test('all returned errors extend BasePineconeError', () => {
    const statuses = [400, 401, 403, 404, 405, 409, 500, 501, 503];
    for (const status of statuses) {
      const err = mapHttpStatusError({ status, url });
      expect(err).toBeInstanceOf(BasePineconeError);
    }
  });
});

describe('handleApiError', () => {
  test('converts ResponseError to the appropriate Pinecone error', async () => {
    const e = buildResponseError(400, 'bad request');
    const result = await handleApiError(e);
    expect(result).toBeInstanceOf(PineconeBadRequestError);
  });

  test('applies customMessage when provided', async () => {
    const e = buildResponseError(400, 'raw error text');
    const result = await handleApiError(e, async (_, raw) => `Custom: ${raw}`);
    expect(result.message).toBe('Custom: raw error text');
  });

  test('uses response url over passed url', async () => {
    const e = buildResponseError(
      404,
      'not found',
      'https://api.pinecone.io/response-url',
    );
    const result = await handleApiError(
      e,
      undefined,
      'https://api.pinecone.io/fallback-url',
    );
    expect(result.message).toContain('response-url');
  });

  test('falls back to passed url when response url is empty', async () => {
    const e = buildResponseError(404, 'not found', '');
    const result = await handleApiError(
      e,
      undefined,
      'https://api.pinecone.io/fallback-url',
    );
    expect(result.message).toContain('fallback-url');
  });

  test('passes through an existing BasePineconeError unchanged', async () => {
    const original = new PineconeBadRequestError({
      status: 400,
      message: 'already mapped',
    });
    const result = await handleApiError(original);
    expect(result).toBe(original);
  });

  test('passes through PineconeConnectionError unchanged', async () => {
    const original = new PineconeConnectionError(new Error('network failure'));
    const result = await handleApiError(original);
    expect(result).toBe(original);
  });

  test('wraps unknown errors in PineconeConnectionError', async () => {
    const unknown = new Error('some unexpected error');
    const result = await handleApiError(unknown);
    expect(result).toBeInstanceOf(PineconeConnectionError);
    expect((result as PineconeConnectionError).cause).toBe(unknown);
  });

  test('does not re-wrap a PineconeBadRequestError as PineconeConnectionError', async () => {
    const badRequest = new PineconeBadRequestError({
      status: 400,
      message: 'invalid',
    });
    const result = await handleApiError(badRequest);
    expect(result).toBeInstanceOf(PineconeBadRequestError);
    expect(result).not.toBeInstanceOf(PineconeConnectionError);
  });
});
