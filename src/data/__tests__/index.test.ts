import { UpsertCommand } from '../upsert';
import { FetchCommand } from '../fetch';
import { QueryCommand } from '../query';
import { Index } from '../index';

jest.mock('../upsert');
jest.mock('../fetch');
jest.mock('../query');

describe('Index', () => {
  let config;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      environment: 'test-environment',
    };
  });

  test('upsert: has type errors when passing malformed metadata', async () => {
    type MovieMetadata = {
      genre: string;
      runtime: number;
    };
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(UpsertCommand).toHaveBeenCalledTimes(1);

    // No ts errors when upserting with propert MovieMetadata
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
    type MovieMetadata = {
      genre: string;
      runtime: number;
    };
    const index = new Index<MovieMetadata>('index-name', config, 'namespace');
    expect(FetchCommand).toHaveBeenCalledTimes(1);

    const response = await index.fetch(['1']);
    if (response && response.vectors) {
      // eslint-disable-next-line
      Object.entries(response.vectors).forEach(([key, value]) => {
        // No errors on these because they are properties from MovieMetadata
        console.log(value.metadata?.genre);
        console.log(value.metadata?.runtime);

        // @ts-expect-error because result is expecting metadata to be MovieMetadata
        console.log(value.metadata?.bogus);
      });
    }
  });

  test('query: returns typed results', async () => {
    type MovieMetadata = {
      genre: string;
      runtime: number;
    };
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
});
