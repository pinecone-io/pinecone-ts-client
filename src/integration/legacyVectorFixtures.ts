import { Pinecone } from '../pinecone';

export interface LegacyVectorFixtures {
  dense: { name: string };
  sparse: { name: string };
}

/**
 * Reserved-only schemas retain the vectors API contract. The shared document
 * fixture uses a named field and cannot exercise these legacy operations.
 * Register the name for cleanup before calling this function, including when
 * creation succeeds but readiness polling fails.
 */
export const createLegacyVectorIndex = async (
  client: Pinecone,
  name: string,
  kind: keyof LegacyVectorFixtures,
) => {
  await client.indexes.create({
    name,
    deployment: {
      deploymentType: 'managed',
      cloud: 'aws',
      region: 'us-west-2',
    },
    schema: {
      fields:
        kind === 'dense'
          ? {
              _values: {
                type: 'dense_vector',
                dimension: 2,
                metric: 'dotproduct',
              },
            }
          : { _sparse_values: { type: 'sparse_vector' } },
    },
    tags: { project: 'integration-test' },
    waitUntilReady: true,
    timeout: 120000,
  });
};
