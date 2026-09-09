import { decorateIndexModel } from '../../control/indexes/decorateIndexModel';
import type { IndexModelData } from '../../control/indexes/listIndexes';

// This interoperability check also runs under the optional Edge Jest config.
// It needs no fleet resources: the behavior is JavaScript object serialization.
test('legacy accessors preserve JSON and strict equality in this runtime', () => {
  const plain: IndexModelData = {
    name: 'document-index',
    host: 'document-index.pinecone.io',
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-east-1',
    },
    status: { ready: true, state: 'Ready' },
    schema: { fields: { title: { type: 'string' } } },
    deletionProtection: 'disabled',
  };
  const decorated = decorateIndexModel({ ...plain });
  expect(() => decorated.dimension).toThrow();
  expect(JSON.stringify(decorated)).toBe(JSON.stringify(plain));
  expect(decorated).toStrictEqual(plain);
});
