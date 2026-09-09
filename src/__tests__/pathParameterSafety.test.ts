import { X_PINECONE_API_VERSION as CONTROL_VERSION } from '../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION as DATA_VERSION } from '../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION as ADMIN_VERSION } from '../pinecone-generated-ts-fetch/admin';
import { X_PINECONE_API_VERSION as INFERENCE_VERSION } from '../pinecone-generated-ts-fetch/inference';
import { X_PINECONE_API_VERSION as ASSISTANT_CONTROL_VERSION } from '../pinecone-generated-ts-fetch/assistant_control';
import { X_PINECONE_API_VERSION as ASSISTANT_DATA_VERSION } from '../pinecone-generated-ts-fetch/assistant_data';
import { indexOperationsBuilder } from '../control/indexOperationsBuilder';
import { adminOperationsBuilder } from '../admin/adminOperationsBuilder';
import { inferenceOperationsBuilder } from '../inference/inferenceOperationsBuilder';
import { asstControlOperationsBuilder } from '../assistant/control/asstControlOperationsBuilder';
import { asstMetricsOperationsBuilder } from '../assistant/control/asstMetricsOperationsBuilder';
import { AsstDataOperationsProvider } from '../assistant/data/asstDataOperationsProvider';
import { NamespaceOperationsProvider } from '../data/namespaces/namespacesOperationsProvider';
import { OAUTH_TOKEN_URL } from '../admin/tokenProvider';
import { PineconeArgumentError } from '../errors';
import type { FetchAPI } from '../pinecone-generated-ts-fetch/db_control';

const HOST = 'https://mocked.test.pinecone.io';

const buildTransport = () => {
  const urls: string[] = [];
  const fetchApi = jest.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const body =
        url === OAUTH_TOKEN_URL
          ? { access_token: 'test-token', expires_in: 3600 }
          : {};
      if (url !== OAUTH_TOKEN_URL) {
        urls.push(url);
      }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  ) as unknown as FetchAPI;
  return { fetchApi, urls };
};

type Invoke = (identifier: string, fetchApi: FetchAPI) => Promise<unknown>;

const config = (fetchApi: FetchAPI) => ({
  apiKey: 'test-api-key',
  controllerHostUrl: HOST,
  fetchApi,
});

/**
 * One path-parameterized route per generated module, reached through the same
 * builder the client uses, so the assertion covers the real path builder and
 * the real middleware stack rather than a stand-in.
 */
const routes: Array<[string, string, Invoke]> = [
  [
    'db_control',
    '/indexes',
    (identifier, fetchApi) =>
      indexOperationsBuilder(config(fetchApi)).describeIndexRaw({
        xPineconeApiVersion: CONTROL_VERSION,
        indexName: identifier,
      }),
  ],
  [
    'db_data',
    '/namespaces',
    async (identifier, fetchApi) => {
      const api = await new NamespaceOperationsProvider(
        config(fetchApi),
        'index',
        HOST,
      ).provide();
      return api.describeNamespaceRaw({
        xPineconeApiVersion: DATA_VERSION,
        namespace: identifier,
      });
    },
  ],
  [
    'inference',
    '/models',
    (identifier, fetchApi) =>
      inferenceOperationsBuilder(config(fetchApi)).getModelRaw({
        xPineconeApiVersion: INFERENCE_VERSION,
        modelName: identifier,
      }),
  ],
  [
    'assistant_control',
    '/assistants',
    (identifier, fetchApi) =>
      asstControlOperationsBuilder(config(fetchApi)).getAssistantRaw({
        xPineconeApiVersion: ASSISTANT_CONTROL_VERSION,
        assistantName: identifier,
      }),
  ],
  [
    'assistant_data',
    '/files',
    async (identifier, fetchApi) => {
      const api = await new AsstDataOperationsProvider(
        config(fetchApi),
        'assistant',
        HOST,
      ).provideData();
      return api.listFilesRaw({
        xPineconeApiVersion: ASSISTANT_DATA_VERSION,
        assistantName: identifier,
      });
    },
  ],
  [
    'admin',
    '/admin/projects',
    (identifier, fetchApi) =>
      adminOperationsBuilder({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        controllerHostUrl: HOST,
        fetchApi,
      }).projects.fetchProjectRaw({
        xPineconeApiVersion: ADMIN_VERSION,
        projectId: identifier,
      }),
  ],
];

describe.each(routes)('%s path parameters', (_module, prefix, invoke) => {
  test.each(['.', '..'])(
    'a path parameter of %p is refused before the request goes out',
    async (identifier) => {
      const { fetchApi, urls } = buildTransport();
      await expect(invoke(identifier, fetchApi)).rejects.toThrow(
        PineconeArgumentError,
      );
      expect(urls).toHaveLength(0);
    },
  );

  test.each([
    ['ns-1', 'ns-1'],
    ['a/b', 'a%2Fb'],
    ['%2e%2e', '%252e%252e'],
    ['%2E', '%252E'],
    ['a.b', 'a.b'],
    ['...', '...'],
  ])('a path parameter of %p reaches %p', async (identifier, encoded) => {
    const { fetchApi, urls } = buildTransport();
    await invoke(identifier, fetchApi);

    expect(urls).toHaveLength(1);
    const suffix = `${prefix}/${encoded}`;
    const pathname = new URL(urls[0]).pathname;
    expect(pathname.slice(-suffix.length)).toBe(suffix);
  });
});

test('assistant_evaluation carries the same guard', async () => {
  const { fetchApi } = buildTransport();
  const api = asstMetricsOperationsBuilder(config(fetchApi));
  const middleware = api['configuration'].middleware;
  const pre = middleware.filter((m) => m.pre);
  expect(pre.length).toBeGreaterThan(0);

  // The module exposes no path-parameterized route today, so the guard is
  // asserted against its middleware directly.
  await expect(
    Promise.all(
      pre.map((m) =>
        m.pre!({
          fetch: fetchApi,
          url: `${HOST}/evaluation/metrics/..`,
          init: {},
        }),
      ),
    ),
  ).rejects.toThrow(PineconeArgumentError);
});
