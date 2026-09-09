/**
 * Keyless smoke gate: real clients, providers, serialization, and host caching
 * over a mocked HTTP transport. Cover both vectors and documents APIs, plus
 * namespace management. Unrouted requests fail instead of reaching a backend.
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
  host: DATA_HOST,
  deployment: { deployment_type: 'managed', cloud: 'gcp', region: 'us-east1' },
  schema: {
    fields: {
      _values: { type: 'dense_vector', dimension: 3, metric: 'cosine' },
      _sparse_values: { type: 'sparse_vector' },
    },
  },
  deletion_protection: 'disabled',
  read_capacity: { mode: 'OnDemand', status: { state: 'Ready' } },
  status: { ready: true, state: 'Ready' },
};

const DOCUMENT_INDEX = 'mocked-documents';
const DOCUMENT_HOST = 'mocked-documents.svc.test.pinecone.io';
const DOCUMENT_PLANE = `https://${DOCUMENT_HOST}`;
const NAMESPACE = 'smoke-documents';
const documentIndexBody = {
  ...describeIndexBody,
  name: DOCUMENT_INDEX,
  host: DOCUMENT_HOST,
  schema: {
    fields: {
      embedding: { type: 'dense_vector', dimension: 3, metric: 'cosine' },
      title: { type: 'string', full_text_search: { language: 'english' } },
    },
  },
};

type RouteHit = {
  url: string;
  method: string;
  headers: Headers;
  body?: unknown;
};

/**
 * Build a fetch mock that routes control and both data APIs by URL + method and
 * records which legs were exercised. Any unrouted request fails loudly so a
 * plumbing change that hits an unexpected endpoint can't pass silently.
 */
const buildFetchMock = () => {
  const hits: RouteHit[] = [];
  const mockFetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method || 'GET').toUpperCase();
      hits.push({
        url,
        method,
        headers: new Headers(init?.headers),
        body:
          typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      });

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
      if (
        method === 'GET' &&
        url === `${CONTROL_PLANE}/indexes/${DOCUMENT_INDEX}`
      ) {
        return json(documentIndexBody);
      }
      if (
        method === 'POST' &&
        url === `${DOCUMENT_PLANE}/namespaces/${NAMESPACE}/documents/upsert`
      ) {
        return json({ upserted_count: 1 });
      }
      if (
        method === 'POST' &&
        url === `${DOCUMENT_PLANE}/namespaces/${NAMESPACE}/documents/search`
      ) {
        return json({
          matches: [{ _id: 'doc-1', _score: 0.98, title: 'Hello' }],
          namespace: NAMESPACE,
          usage: { read_units: 2 },
        });
      }
      if (method === 'GET' && url === `${DOCUMENT_PLANE}/namespaces`) {
        return json({ namespaces: [{ name: NAMESPACE, record_count: '1' }] });
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

const expectVersionHeaders = (hits: RouteHit[]) => {
  const controlHits = hits.filter((hit) => hit.url.startsWith(CONTROL_PLANE));
  const dataHits = hits.filter(
    (hit) =>
      hit.url.startsWith(DATA_PLANE) || hit.url.startsWith(DOCUMENT_PLANE),
  );
  expect(controlHits.length).toBeGreaterThan(0);
  expect(dataHits.length).toBeGreaterThan(0);
  for (const hit of [...controlHits, ...dataHits]) {
    expect(hit.headers.get('X-Pinecone-Api-Version')).toBe('2026-07');
  }
};

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
    expectVersionHeaders(hits);
  });

  test('2026-07 index fields survive HTTP deserialization', async () => {
    const { mockFetch } = buildFetchMock();
    const pc = new Pinecone({
      apiKey: 'mocked-key',
      controllerHostUrl: CONTROL_PLANE,
      fetchApi: mockFetch,
    });
    const result = await pc.indexes.describe(INDEX_NAME);
    expect(result.dimension).toBe(3);
    expect(result.metric).toBe('cosine');
    expect(result.vectorType).toBe('dense');
    expect('serverless' in result.spec).toBe(true);
    if ('serverless' in result.spec) {
      expect(result.spec.serverless.readCapacity).toBe(result.readCapacity);
    }
    expect(result).toMatchObject({
      name: INDEX_NAME,
      host: DATA_HOST,
      deployment: {
        deploymentType: 'managed',
        cloud: 'gcp',
        region: 'us-east1',
      },
      schema: describeIndexBody.schema,
      deletionProtection: 'disabled',
      readCapacity: { mode: 'OnDemand', status: { state: 'Ready' } },
      status: { ready: true, state: 'Ready' },
    });
  });

  test('connect → documents upsert/search → list namespaces uses the real wire contract', async () => {
    const { mockFetch, hits } = buildFetchMock();
    const pc = new Pinecone({
      apiKey: 'mocked-key',
      controllerHostUrl: CONTROL_PLANE,
      fetchApi: mockFetch,
    });
    const index = pc.index({ name: DOCUMENT_INDEX });
    const scoped = index.namespace(NAMESPACE);
    const documents = [
      { _id: 'doc-1', embedding: [0.1, 0.2, 0.3], title: 'Hello' },
    ];
    expect(await scoped.upsertDocuments({ documents })).toEqual({
      upsertedCount: 1,
    });
    expect(
      await scoped.searchDocuments({
        scoreBy: [
          {
            type: 'dense_vector',
            fields: ['embedding'],
            values: [0.1, 0.2, 0.3],
          },
        ],
        topK: 1,
        includeFields: ['title'],
      }),
    ).toEqual({
      matches: [{ _id: 'doc-1', _score: 0.98, title: 'Hello' }],
      namespace: NAMESPACE,
      usage: { readUnits: 2 },
    });
    expect(await index.listNamespaces()).toMatchObject({
      namespaces: [{ name: NAMESPACE, recordCount: '1' }],
    });
    expect(hits.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'GET', url: `${CONTROL_PLANE}/indexes/${DOCUMENT_INDEX}` },
      {
        method: 'POST',
        url: `${DOCUMENT_PLANE}/namespaces/${NAMESPACE}/documents/upsert`,
      },
      {
        method: 'POST',
        url: `${DOCUMENT_PLANE}/namespaces/${NAMESPACE}/documents/search`,
      },
      { method: 'GET', url: `${DOCUMENT_PLANE}/namespaces` },
    ]);
    expect(hits[1].body).toEqual({ documents });
    expect(hits[2].body).toEqual({
      score_by: [
        {
          type: 'dense_vector',
          fields: ['embedding'],
          values: [0.1, 0.2, 0.3],
        },
      ],
      top_k: 1,
      include_fields: ['title'],
    });
    expectVersionHeaders(hits);
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
