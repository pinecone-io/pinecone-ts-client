import { Pinecone } from '../../index';
import { PineconeNotFoundError } from '../../errors';
import { assertWithRetries, randomName, retryDelete } from '../test-helpers';

// 2026-07 cannot create pod deployments. Supply a dedicated, stable pod fixture;
// this suite snapshots it without writing records or deleting the source index.
// Track fixture provisioning in #21.
const sourceName = process.env.PINECONE_COLLECTION_SOURCE_INDEX;
const describeWithPodFixture = sourceName ? describe : describe.skip;
describeWithPodFixture(
  'pod collection lifecycle (PINECONE_COLLECTION_SOURCE_INDEX)',
  () => {
    test('creates, lists, describes and deletes a collection of seeded vectors', async () => {
      const pc = new Pinecone();
      const collectionName = randomName('collection-snapshot');
      const failures: unknown[] = [];
      let collectionAttempted = false;
      try {
        const source = await pc.indexes.describe(sourceName!);
        expect(source.deployment.deploymentType).toBe('pod');
        const index = pc.index({ name: sourceName! });
        const stats = await index.describeIndexStats();
        expect(stats.totalRecordCount).toEqual(expect.any(Number));
        collectionAttempted = true;
        const created = await pc.collections.create({
          name: collectionName,
          source: sourceName!,
        });
        expect(created.name).toBe(collectionName);
        await assertWithRetries(
          () => pc.collections.describe(collectionName),
          (collection) => {
            expect(collection).toMatchObject({
              name: collectionName,
              status: 'Ready',
              vectorCount: stats.totalRecordCount,
            });
          },
        );
        await assertWithRetries(
          () => pc.collections.list(),
          (list) => {
            expect(list.collections).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  name: collectionName,
                  status: 'Ready',
                }),
              ]),
            );
          },
        );
        await pc.collections.delete(collectionName);
        await assertWithRetries(
          async () => {
            await expect(
              pc.collections.describe(collectionName),
            ).rejects.toBeInstanceOf(PineconeNotFoundError);
          },
          () => {},
        );
        collectionAttempted = false;
      } catch (error) {
        failures.push(error);
      } finally {
        const cleanup = await Promise.allSettled([
          ...(collectionAttempted
            ? [
                retryDelete(
                  () => pc.collections.delete(collectionName),
                  `collection '${collectionName}'`,
                ),
              ]
            : []),
        ]);
        failures.push(
          ...cleanup.flatMap((result) =>
            result.status === 'rejected' ? [result.reason] : [],
          ),
        );
      }
      if (failures.length === 1) throw failures[0];
      if (failures.length)
        throw new AggregateError(
          failures,
          `Collection lifecycle failed: ${failures.map(String).join('; ')}`,
        );
    });
  },
);
