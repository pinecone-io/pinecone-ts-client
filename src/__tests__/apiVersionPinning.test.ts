import { Pinecone } from '../index';

const CONTROL_PLANE = 'https://api.test.pinecone.io';
const INDEX_NAME = 'pinned-version';
const DATA_HOST = 'pinned-version-abc1234.svc.test.pinecone.io';
const PINNED = '2026-01';
const DEFAULT_VERSION = '2026-07';

type Capture = { url: string; headers: Record<string, string> };

const buildFetchMock = (captures: Capture[]) =>
  jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      captures.push({
        url: typeof input === 'string' ? input : input.toString(),
        headers: { ...((init?.headers || {}) as Record<string, string>) },
      });
      return new Response(JSON.stringify({ indexes: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );

const clientFor = (
  captures: Capture[],
  additionalHeaders?: Record<string, string>,
) =>
  new Pinecone({
    apiKey: 'test-api-key',
    controllerHostUrl: CONTROL_PLANE,
    fetchApi: buildFetchMock(captures),
    additionalHeaders,
  });

const versionsSent = (captures: Capture[]) =>
  captures.map((capture) => capture.headers['X-Pinecone-Api-Version']);

describe('pinning the API version through additionalHeaders', () => {
  test('a pinned client sends the pinned version on control-plane calls', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'X-Pinecone-Api-Version': PINNED });

    await pc.indexes.list();

    expect(captures).toHaveLength(1);
    expect(captures[0].url).toBe(`${CONTROL_PLANE}/indexes`);
    expect(versionsSent(captures)).toEqual([PINNED]);
  });

  test('a pinned client sends the pinned version on data-plane calls', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'X-Pinecone-Api-Version': PINNED });

    await pc
      .index({ name: INDEX_NAME, host: DATA_HOST })
      .namespace('pinned')
      .deleteAll();

    expect(captures).toHaveLength(1);
    expect(versionsSent(captures)).toEqual([PINNED]);
  });

  test('a pinned client sends the pinned version on upsertRecords', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'X-Pinecone-Api-Version': PINNED });

    await pc
      .index({ name: INDEX_NAME, host: DATA_HOST })
      .upsertRecords({ records: [{ id: 'rec1', chunk_text: 'hello' }] });

    expect(captures).toHaveLength(1);
    expect(versionsSent(captures)).toEqual([PINNED]);
  });

  test('index-level headers win over client-level headers', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'X-Pinecone-Api-Version': PINNED });

    await pc
      .index({
        name: INDEX_NAME,
        host: DATA_HOST,
        additionalHeaders: { 'X-Pinecone-Api-Version': '2025-10' },
      })
      .deleteAll();

    expect(versionsSent(captures)).toEqual(['2025-10']);
  });

  test('an unpinned client still sends the version the SDK is built against', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures);

    await pc.indexes.list();
    await pc.index({ name: INDEX_NAME, host: DATA_HOST }).deleteAll();

    expect(versionsSent(captures)).toEqual([DEFAULT_VERSION, DEFAULT_VERSION]);
  });

  test('a differently cased key does not displace the version header', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'x-pinecone-api-version': PINNED });

    await pc.indexes.list();

    expect(versionsSent(captures)).toEqual([DEFAULT_VERSION]);
    expect(captures[0].headers['x-pinecone-api-version']).toBe(PINNED);
  });

  test('headers the SDK does not set are still carried through', async () => {
    const captures: Capture[] = [];
    const pc = clientFor(captures, { 'X-Request-Source': 'nightly-reindex' });

    await pc.indexes.list();
    await pc.index({ name: INDEX_NAME, host: DATA_HOST }).deleteAll();

    expect(
      captures.map((capture) => capture.headers['X-Request-Source']),
    ).toEqual(['nightly-reindex', 'nightly-reindex']);
    expect(versionsSent(captures)).toEqual([DEFAULT_VERSION, DEFAULT_VERSION]);
  });
});
