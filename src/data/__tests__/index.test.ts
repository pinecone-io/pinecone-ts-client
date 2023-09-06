import { FetchCommand } from '../fetch';
import { QueryCommand } from '../query';
import { UpdateCommand } from '../update';
import { UpsertCommand } from '../upsert';
import { Index } from '../index';

jest.mock('../fetch');
jest.mock('../query');
jest.mock('../update');
jest.mock('../upsert');

describe('Index', () => {
  let config;

  type MovieMetadata = {
    genre: string;
    runtime: number;
  };

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      environment: 'test-environment',
    };
  });

  test('can be used without generic types param', async () => {
    const index = new Index('index-name', config, 'namespace');

    // You can use the index class without passing the generic type for metadata,
    // but you lose type safety in that case.
    await index.update({ id: '1', metadata: { foo: 'bar' } });
    await index.update({ id: '1', metadata: { baz: 'quux' } });

    // Same thing with upsert. You can upsert anything in metadata field without type.
    await index.upsert([
      { id: '2', values: [0.1, 0.2], metadata: { hello: 'world' } },
    ]);

    // @ts-expect-error even when you haven't passed a generic type, it enforces the expected shape of Record<string, RecordMetadataValue>
    await index.upsert([{ id: '2', values: [0.1, 0.2], metadata: 2 }]);
  });

  test('preserves metadata typing through chained namespace calls', async () => {
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    const ns1 = index.namespace('ns1');

    // @ts-expect-error because MovieMetadata metadata still expected after chained namespace call
    await ns1.update({ id: '1', metadata: { title: 'Vertigo', rating: 5 } });
  });

  test('upsert: has type errors when passing malformed metadata', async () => {
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(UpsertCommand).toHaveBeenCalledTimes(1);

    // No ts errors when upserting with proper MovieMetadata
    await index.upsert([
      {
        id: '1',
        values: [0.1, 0.1, 0.1],
        metadata: {
          genre: 'romance',
          runtime: 120,
        },
      },
    ]);

    // No ts errors when upserting with no metadata
    await index.upsert([
      {
        id: '2',
        values: [0.1, 0.1, 0.1],
      },
    ]);

    // ts error expected when passing metadata that doesn't match MovieMetadata
    await index.upsert([
      {
        id: '3',
        values: [0.1, 0.1, 0.1],
        metadata: {
          // @ts-expect-error
          somethingElse: 'foo',
        },
      },
    ]);
  });

  test('fetch: response is typed with generic metadata type', async () => {
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(FetchCommand).toHaveBeenCalledTimes(1);

    const response = await index.fetch(['1']);
    if (response && response.records) {
      // eslint-disable-next-line
      Object.entries(response.records).forEach(([key, value]) => {
        // No errors on these because they are properties from MovieMetadata
        console.log(value.metadata?.genre);
        console.log(value.metadata?.runtime);

        // @ts-expect-error because result is expecting metadata to be MovieMetadata
        console.log(value.metadata?.bogus);
      });
    }
  });

  test('query: returns typed results', async () => {
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(QueryCommand).toHaveBeenCalledTimes(1);

    const results = await index.query({ id: '1', topK: 5 });
    if (results && results.matches) {
      if (results.matches.length > 0) {
        const firstResult = results.matches[0];

        // no ts error because score is part of ScoredPineconeRecord
        console.log(firstResult.score);

        // no ts error because genre and runtime part of MovieMetadata
        console.log(firstResult.metadata?.genre);
        console.log(firstResult.metadata?.runtime);

        // @ts-expect-error because bogus not part of MovieMetadata
        console.log(firstResult.metadata?.bogus);
      }
    }
  });

  test('update: has typed arguments', async () => {
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(UpdateCommand).toHaveBeenCalledTimes(1);

    // Can update metadata only without ts errors
    await index.update({
      id: '1',
      metadata: { genre: 'romance', runtime: 90 },
    });

    // Can update values only without ts errors
    await index.update({ id: '2', values: [0.1, 0.2, 0.3] });

    // Can update sparseValues only without ts errors
    await index.update({
      id: '3',
      sparseValues: { indices: [0, 3], values: [0.2, 0.5] },
    });

    // Can update all fields without ts errors
    await index.update({
      id: '4',
      values: [0.1, 0.2, 0.3],
      sparseValues: { indices: [0], values: [0.789] },
      metadata: { genre: 'horror', runtime: 10 },
    });

    // @ts-expect-error when id is missing
    await index.update({ metadata: { genre: 'drama', runtime: 97 } });

    // @ts-expect-error when metadata has unexpected fields
    await index.update({ id: '5', metadata: { title: 'Vertigo' } });

    await index.update({
      id: '6',
      // @ts-expect-error when metadata has extra properties
      metadata: { genre: 'comedy', runtime: 80, title: 'Miss Congeniality' },
    });
  });
});
