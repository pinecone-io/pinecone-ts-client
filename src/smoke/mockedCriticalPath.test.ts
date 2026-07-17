/**
 * Mocked critical-path smoke test — connect → upsert → query.
 *
 * This is the *mocked* half of the smoke-test gate. Unlike the keyed suites
 * under `src/integration/` (which hit a real Pinecone backend and require
 * `PINECONE_API_KEY`), this scenario runs the same connect → upsert → query
 * flow against a mocked HTTP transport. It therefore runs on **every** pull
 * request in CI, with no API key, and guards the three most critical use cases
 * against a regression in the request/response plumbing:
 *
 *   1. connect — construct a client and resolve an index host via describe
 *   2. upsert  — write vectors to the data plane
 *   3. query   — read them back by vector similarity
 *
 * We inject the mock at the transport layer via `PineconeConfiguration.fetchApi`
 * (the TS analogue of Python's respx). Everything above `fetch` — config
 * resolution, host caching, request building, response deserialization — is the
 * real code path, so this catches wiring regressions that an API-object-level
 * mock would paper over. Because JS is uniformly promise-based there is no
 * separate sync/async split as in the Python SDK; one async flow covers it.
 *
 * The real (keyed) counterpart lives in `src/integration/` and runs in the
 * Testing workflow with `PINECONE_API_KEY` supplied.
 */

import { Pinecone } from '../index';
import { IndexHostSingleton } from '../data/indexHostSingleton';

// Control-plane base used for the (mocked) describe-index call. A non-default
// host keeps these mocks from ever touching api.pinecone.io by accident.
const CONTROL_PLANE = 'https://api.test.pinecone.io';

const INDEX_NAME = 'mocked-critical-path';
const DATA_HOST = 'mocked-critical-path-abc1234.svc.us-east1-gcp.pinecone.io';
const DATA_PLANE = `https://${DATA_HOST}`;

// A valid describe-index (IndexModel) response body for INDEX_NAME.
const describeIndexBody = {
  name: INDEX_NAME,
  dimension: 3,
  metric: 'cosine',
  host: DATA_HOST,
  spec: { serverless: { cloud: 'gcp', region: 'us-east1' } },
  status: { ready: true, state: 'Ready' },
  vector_type: 'dense',
};

type RouteHit = { url: string; method: string };

/**
 * Build a fetch mock that routes describe → upsert → query by URL + method and
 * records which legs were exercised. Any unrouted request fails loudly so a
 * plumbing change that hits an unexpected endpoint can't pass silently.
 */
const buildFetchMock = () => {
  const hits: RouteHit[] = [];
  const mockFetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method || 'GET').toUpperCase();
      hits.push({ url, method });

      const json = (body: object) =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });

      // 1. connect: GET {control}/indexes/{name} resolves the data-plane host.
      if (
        method === 'GET' &&
        url === `${CONTROL_PLANE}/indexes/${INDEX_NAME}`
      ) {
        return json(describeIndexBody);
      }
      // 2. upsert: POST https://{host}/vectors/upsert
      if (method === 'POST' && url === `${DATA_PLANE}/vectors/upsert`) {
        return json({ upsertedCount: 3 });
      }
      // 3. query: POST https://{host}/query
      if (method === 'POST' && url === `${DATA_PLANE}/query`) {
        return json({
          matches: [
            { id: 'v1', score: 0.99 },
            { id: 'v2', score: 0.87 },
          ],
          namespace: '',
          usage: { readUnits: 5 },
        });
      }

      throw new Error(
        `Unexpected request in mocked smoke test: ${method} ${url}`,
      );
    },
  );
  return { mockFetch, hits };
};

const countHits = (hits: RouteHit[], method: string, url: string) =>
  hits.filter((h) => h.method === method && h.url === url).length;

describe('mocked critical path (no API key)', () => {
  // The data-plane host is cached in a process-global singleton keyed by
  // apiKey+indexName; reset it between tests so each scenario starts cold and
  // the host-cache assertion below is meaningful in isolation.
  afterEach(() => {
    IndexHostSingleton._reset();
  });

  test('connect → upsert → query works end to end against a mocked backend', async () => {
    const { mockFetch, hits } = buildFetchMock();

    const pc = new Pinecone({
      apiKey: 'mocked-key',
      controllerHostUrl: CONTROL_PLANE,
      fetchApi: mockFetch,
    });
    const index = pc.index({ name: INDEX_NAME });

    // `upsert()` resolves to void in the TS SDK, so we assert the write leg via
    // the recorded transport hit below rather than a return value.
    await index.upsert({
      records: [
        { id: 'v1', values: [0.1, 0.2, 0.3] },
        { id: 'v2', values: [0.4, 0.5, 0.6] },
        { id: 'v3', values: [0.7, 0.8, 0.9] },
      ],
    });

    const queryResult = await index.query({ vector: [0.1, 0.2, 0.3], topK: 2 });
    expect(queryResult.matches.map((m) => m.id)).toEqual(['v1', 'v2']);
    expect(queryResult.matches[0].score).toBeCloseTo(0.99);

    // Every leg of the critical path was actually exercised.
    expect(
      countHits(hits, 'GET', `${CONTROL_PLANE}/indexes/${INDEX_NAME}`),
    ).toBe(1);
    expect(countHits(hits, 'POST', `${DATA_PLANE}/vectors/upsert`)).toBe(1);
    expect(countHits(hits, 'POST', `${DATA_PLANE}/query`)).toBe(1);
  });

  test('resolving the same index twice issues only one describe call (host cache)', async () => {
    const { mockFetch, hits } = buildFetchMock();

    const pc = new Pinecone({
      apiKey: 'mocked-key',
      controllerHostUrl: CONTROL_PLANE,
      fetchApi: mockFetch,
    });

    await pc
      .index({ name: INDEX_NAME })
      .upsert({ records: [{ id: 'v1', values: [0.1, 0.2, 0.3] }] });
    await pc
      .index({ name: INDEX_NAME })
      .upsert({ records: [{ id: 'v2', values: [0.4, 0.5, 0.6] }] });

    expect(
      countHits(hits, 'GET', `${CONTROL_PLANE}/indexes/${INDEX_NAME}`),
    ).toBe(1);
  });
});
