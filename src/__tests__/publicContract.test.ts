import * as pinecone from '../index';

describe('public package contract', () => {
  test('pins the runtime barrel exports', () => {
    expect(Object.keys(pinecone).sort()).toMatchSnapshot();
    expect(Object.keys(pinecone.Errors).sort()).toMatchSnapshot();
  });

  test('constructs the exported resource classes through Pinecone', () => {
    const pc = new pinecone.Pinecone({ apiKey: 'test-key' });
    expect(pc.indexes).toBeInstanceOf(pinecone.Indexes);
    expect(pc.collections).toBeInstanceOf(pinecone.Collections);
    expect(pc.backups).toBeInstanceOf(pinecone.Backups);
    expect(pc.backupSchedules).toBeInstanceOf(pinecone.BackupSchedules);
    expect(pc.restoreJobs).toBeInstanceOf(pinecone.RestoreJobs);
    expect(pc.assistants).toBeInstanceOf(pinecone.Assistants);
    expect(pc.inference).toBeInstanceOf(pinecone.Inference);
    expect(pc.index('test')).toBeInstanceOf(pinecone.Index);
    expect(pc.Index('test')).toBeInstanceOf(pinecone.Index);
    expect(pc.assistant('test')).toBeInstanceOf(pinecone.Assistant);
    expect(pc.Assistant('test')).toBeInstanceOf(pinecone.Assistant);
  });
});
