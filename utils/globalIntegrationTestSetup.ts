import dotenv from 'dotenv';
import { Pinecone } from '../src';

dotenv.config();

const requiredEnvVars = ['PINECONE_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

class GlobalTestSetupAndTearDown {
  pc: Pinecone;

  constructor() {
    this.pc = new Pinecone();

    this.setupIndexes().then(() => {});
  }

  async setupIndexes() {
    const serverlessIndexName = 'integration-test-serverless';
    const podIndexName = 'integration-test-pod';

    const existingIndexes = await this.pc.listIndexes();

    if (existingIndexes.indexes) {
      const indexNames = existingIndexes.indexes.map((index) => index.name);

      if (indexNames.includes(serverlessIndexName)) {
      } else {
        await this.pc.createIndex({
          name: serverlessIndexName,
          dimension: 2,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-west-2',
            },
          },
        });
      }

      if (indexNames.includes(podIndexName)) {
      } else {
        await this.pc.createIndex({
          name: podIndexName,
          dimension: 2,
          metric: 'cosine',
          spec: {
            pod: {
              podType: 'p1.x2',
              environment: 'us-east1-gcp',
            },
          },
        });
      }
    }
  }
}

new GlobalTestSetupAndTearDown();
