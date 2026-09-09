import {
  Pinecone,
  Indexes,
  Collections,
  Backups,
  RestoreJobs,
  Assistants,
  Inference,
} from '../index';

describe('Client initialization', () => {
  test('can accept a config object', () => {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
    expect(client.indexes).toBeInstanceOf(Indexes);
    expect(client.collections).toBeInstanceOf(Collections);
    expect(client.backups).toBeInstanceOf(Backups);
    expect(client.restoreJobs).toBeInstanceOf(RestoreJobs);
    expect(client.assistants).toBeInstanceOf(Assistants);
    expect(client.inference).toBeInstanceOf(Inference);
  });

  test('can accept no arguments and read from environment variables', () => {
    const client = new Pinecone();
    expect(client.indexes).toBeInstanceOf(Indexes);
    expect(client.collections).toBeInstanceOf(Collections);
    expect(client.backups).toBeInstanceOf(Backups);
    expect(client.restoreJobs).toBeInstanceOf(RestoreJobs);
    expect(client.assistants).toBeInstanceOf(Assistants);
    expect(client.inference).toBeInstanceOf(Inference);
  });
});
