import { setup } from '../integration/setup';
import { teardown } from '../integration/teardown';
import { Pinecone } from '../pinecone';
import {
  cleanupResources,
  waitUntilRecordsReady,
} from '../integration/test-helpers';

jest.mock('../pinecone', () => ({ Pinecone: jest.fn() }));
jest.mock('../integration/test-helpers', () => ({
  ...jest.requireActual('../integration/test-helpers'),
  cleanupResources: jest.fn(),
  waitUntilRecordsReady: jest.fn(),
}));

const cleanup = jest.mocked(cleanupResources);
const create = jest.fn();
const upsertDocuments = jest.fn();
const createAssistant = jest.fn();
const pc = {
  indexes: { create },
  index: () => ({ upsertDocuments }),
  assistants: { create: createAssistant },
};
const originalKey = process.env.PINECONE_API_KEY;
const originalFixtures = process.env.FIXTURES_JSON;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.PINECONE_API_KEY = 'test-key';
  jest.mocked(Pinecone).mockReturnValue(pc as unknown as Pinecone);
  create.mockResolvedValue({});
  upsertDocuments.mockResolvedValue({});
  cleanup.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originalKey === undefined) delete process.env.PINECONE_API_KEY;
  else process.env.PINECONE_API_KEY = originalKey;
  if (originalFixtures === undefined) delete process.env.FIXTURES_JSON;
  else process.env.FIXTURES_JSON = originalFixtures;
});

test('failed create still cleans its registered index name and emits partial fixtures', async () => {
  const error = new Error('create timed out after acceptance');
  create.mockRejectedValue(error);
  await expect(setup()).rejects.toBe(error);
  const name = create.mock.calls[0][0].name;
  expect(cleanup).toHaveBeenCalledWith(pc, [name], []);
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining(`"name":"${name}"`),
  );
  expect(createAssistant).not.toHaveBeenCalled();
});

test('assistant creation failure cleans both resource names', async () => {
  const error = new Error('assistant creation failed');
  createAssistant.mockRejectedValue(error);
  jest.mocked(waitUntilRecordsReady).mockResolvedValue({} as never);
  await expect(setup()).rejects.toBe(error);
  expect(cleanup).toHaveBeenCalledWith(
    pc,
    create.mock.calls.map(([options]) => options.name),
    [createAssistant.mock.calls[0][0].name],
  );
});

test('failed setup retains both setup and cleanup errors', async () => {
  const setupError = new Error('failed setup');
  const cleanupError = new Error('failed cleanup');
  create.mockRejectedValue(setupError);
  cleanup.mockRejectedValue(cleanupError);
  await expect(setup()).rejects.toMatchObject({
    errors: [setupError, cleanupError],
  });
});

test('teardown propagates cleanup failures instead of reporting success', async () => {
  process.env.FIXTURES_JSON = JSON.stringify({
    serverlessIndex: { name: 'index' },
    assistant: { name: 'assistant' },
  });
  const error = new Error('cleanup failed');
  cleanup.mockRejectedValue(error);
  await expect(teardown()).rejects.toBe(error);
  expect(cleanup).toHaveBeenCalledWith(pc, ['index'], ['assistant']);
  expect(console.error).not.toHaveBeenCalledWith('✅ Teardown complete!');
});

test('teardown accepts partial fixtures left by failed setup', async () => {
  process.env.FIXTURES_JSON = JSON.stringify({
    serverlessIndex: { name: 'index' },
  });
  await teardown();
  expect(cleanup).toHaveBeenCalledWith(pc, ['index'], []);
});

test('failed legacy fixture creation retains every accepted index for cleanup', async () => {
  const error = new Error('sparse fixture readiness failed');
  create
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(error);
  await expect(setup()).rejects.toBe(error);
  const names = create.mock.calls.map(([options]) => options.name);
  expect(names).toHaveLength(3);
  expect(create.mock.calls[1][0].schema.fields).toEqual({
    _values: { type: 'dense_vector', dimension: 2, metric: 'dotproduct' },
  });
  expect(create.mock.calls[2][0].schema.fields).toEqual({
    _sparse_values: { type: 'sparse_vector' },
  });
  expect(cleanup).toHaveBeenCalledWith(pc, names, []);
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining(
      JSON.stringify({ cleanupIndexes: names }).slice(1, -1),
    ),
  );
});

test.each([
  {
    serverlessIndex: { name: 'documents' },
    legacyVectors: { dense: { name: 'dense' }, sparse: { name: 'sparse' } },
  },
  { cleanupIndexes: ['documents', 'dense', 'sparse'] },
])(
  'teardown cleans document and legacy indexes from full or partial fixtures',
  async (fixtures) => {
    process.env.FIXTURES_JSON = JSON.stringify(fixtures);
    await teardown();
    expect(cleanup).toHaveBeenCalledWith(
      pc,
      ['documents', 'dense', 'sparse'],
      [],
    );
  },
);
