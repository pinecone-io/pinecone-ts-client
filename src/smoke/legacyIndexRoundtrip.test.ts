import { Pinecone } from '../index';
import type { CreateIndexOptions } from '../control/indexes/createIndex';

const control = 'https://legacy-roundtrip.test.pinecone.io';

// Exercise both compatibility directions through generated HTTP serializers.
// These are contract fixtures, not a claim about legacy integrated-model fleets.
test.each([
  { vectorType: 'dense' as const, dimension: 8, metric: 'cosine' as const },
  { vectorType: 'dense' as const, dimension: 8, metric: 'euclidean' as const },
  { vectorType: 'dense' as const, dimension: 8, metric: 'dotproduct' as const },
  { vectorType: 'sparse' as const, metric: 'dotproduct' as const },
])(
  'legacy $vectorType/$metric create and response roundtrip',
  async (vector) => {
    const name = `legacy-${vector.vectorType}-${vector.metric}`;
    const fields =
      vector.vectorType === 'dense'
        ? {
            _values: {
              type: 'dense_vector',
              dimension: 8,
              metric: vector.metric,
            },
          }
        : { _sparse_values: { type: 'sparse_vector' } };
    const response = {
      name,
      host: `${name}.test.pinecone.io`,
      deployment: {
        deployment_type: 'managed',
        cloud: 'aws',
        region: 'us-east-1',
      },
      // The API co-reports the reserved sparse field for classic dense indexes.
      schema: {
        fields: { ...fields, _sparse_values: { type: 'sparse_vector' } },
      },
      read_capacity: { mode: 'OnDemand', status: { state: 'Ready' } },
      deletion_protection: 'disabled',
      status: { ready: true, state: 'Ready' },
    };
    const requests: Array<{ method: string; path: string }> = [];
    const fetchApi = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        const method = init?.method ?? 'GET';
        requests.push({ method, path });
        expect(new Headers(init?.headers).get('X-Pinecone-Api-Version')).toBe(
          '2026-07',
        );
        if (method === 'POST' && path === '/indexes') {
          expect(JSON.parse(String(init?.body))).toEqual({
            name,
            schema: { fields },
            deployment: {
              deployment_type: 'managed',
              cloud: 'aws',
              region: 'us-east-1',
            },
          });
        } else if (method === 'PATCH' && path === `/indexes/${name}`) {
          expect(JSON.parse(String(init?.body))).toEqual({
            tags: { team: 'search' },
          });
        } else if (!(
          method === 'GET' &&
          (path === '/indexes' || path === `/indexes/${name}`)
        )) {
          throw new Error(`Unexpected request: ${method} ${path}`);
        }
        return new Response(
          JSON.stringify(
            path === '/indexes' && method === 'GET'
              ? { indexes: [response] }
              : response,
          ),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      },
    );
    const pc = new Pinecone({
      apiKey: 'mock-key',
      controllerHostUrl: control,
      fetchApi,
    });
    const options: CreateIndexOptions = {
      name,
      ...vector,
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    };
    const created = await pc.createIndex({
      ...options,
      suppressConflicts: false,
    });
    const ready = await pc.indexes.create({
      ...options,
      waitUntilReady: true,
      suppressConflicts: false,
    });
    const described = await pc.describeIndex(name);
    const configured = await pc.indexes.configure(name, {
      tags: { team: 'search' },
    });
    const listed = (await pc.indexes.list()).indexes?.[0];
    for (const model of [created, ready, described, configured, listed]) {
      expect(model).toBeDefined();
      expect(model?.dimension).toBe(
        vector.vectorType === 'dense' ? 8 : undefined,
      );
      expect(model?.metric).toBe(vector.metric);
      expect(model?.vectorType).toBe(vector.vectorType);
      expect(model?.spec).toEqual({
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
          readCapacity: model?.readCapacity,
          sourceCollection: undefined,
        },
      });
      expect(Object.keys(model ?? {})).not.toEqual(
        expect.arrayContaining(['dimension']),
      );
      expect(model?.embed).toBeUndefined();
    }
    expect(requests).toEqual([
      { method: 'POST', path: '/indexes' },
      { method: 'POST', path: '/indexes' },
      { method: 'GET', path: `/indexes/${name}` },
      { method: 'GET', path: `/indexes/${name}` },
      { method: 'PATCH', path: `/indexes/${name}` },
      { method: 'GET', path: '/indexes' },
    ]);
  },
);
