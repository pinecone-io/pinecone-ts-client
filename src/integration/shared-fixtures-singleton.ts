import { Pinecone } from '../index';
import {
  generateRecords,
  globalNamespaceOne,
  prefix,
  diffPrefix,
  randomString,
  randomIndexName,
  sleep,
  waitUntilAssistantReady,
  waitUntilAssistantFileReady,
} from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// IntegrationFixtures defines resources which are shared across multiple integration test files.
// If there are resources that need to be setup, torn down, and shared across multiple test files,
// it should be managed here.
export interface IntegrationFixtures {
  client: Pinecone;
  serverlessIndex: {
    name: string;
    dimension: number;
    metric: string;
  };
  assistant: {
    name: string;
    testFilePath: string;
  };
}

/**
 * FixtureManager is a singleton class that manages shared integration test resources.
 * It is instantiated once by the custom Jest environment (custom-jest-environment.ts)
 * and shared across all test files.
 */
export class FixtureManager {
  private fixtures: IntegrationFixtures | null = null;
  private setupPromise: Promise<IntegrationFixtures> | null = null;

  async getFixtures(): Promise<IntegrationFixtures> {
    if (this.fixtures) {
      return this.fixtures;
    }

    if (this.setupPromise) {
      return this.setupPromise;
    }

    this.setupPromise = this.setup();
    this.fixtures = await this.setupPromise;
    return this.fixtures;
  }

  private async setup(): Promise<IntegrationFixtures> {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }

    const pinecone = new Pinecone({ apiKey });

    // Create or reuse serverless index
    const serverlessIndexName = await this.setupServerlessIndex(pinecone);

    // Create or reuse assistant
    const { assistantName, testFilePath } = await this.setupAssistant(pinecone);

    const fixtures: IntegrationFixtures = {
      client: pinecone,
      serverlessIndex: {
        name: serverlessIndexName,
        dimension: 2,
        metric: 'dotproduct',
      },
      assistant: {
        name: assistantName,
        testFilePath,
      },
    };

    return fixtures;
  }

  private async setupServerlessIndex(pinecone: Pinecone): Promise<string> {
    const indexName = randomIndexName('ts-integration-shared');

    await pinecone.createIndex({
      name: indexName,
      dimension: 2,
      metric: 'dotproduct',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-west-2',
        },
      },
      waitUntilReady: true,
      tags: { project: 'pinecone-integration-tests-serverless' },
    });

    // Seed with test data
    const recordsToUpsert = generateRecords({
      prefix: prefix,
      dimension: 2,
      quantity: 10,
      withSparseValues: false,
      withMetadata: true,
    });

    const oneRecordWithDiffPrefix = generateRecords({
      prefix: diffPrefix,
      dimension: 2,
      quantity: 1,
      withSparseValues: false,
      withMetadata: true,
    });

    const allRecords = [...oneRecordWithDiffPrefix, ...recordsToUpsert];

    await pinecone
      .index({ name: indexName, namespace: globalNamespaceOne })
      .upsert(allRecords);

    await sleep(45000);

    return indexName;
  }

  private async setupAssistant(
    pinecone: Pinecone
  ): Promise<{ assistantName: string; testFilePath: string }> {
    const assistantName = randomString(5);

    await pinecone.createAssistant({
      name: assistantName,
      instructions: 'test-instructions',
      metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
      region: 'us',
    });

    await waitUntilAssistantReady(assistantName);

    const assistant = pinecone.Assistant({ name: assistantName });

    // Create a temporary file
    const tempFileName = path.join(os.tmpdir(), `tempfile-${Date.now()}.txt`);
    const data = 'This is some temporary data';
    fs.writeFileSync(tempFileName, data);

    await sleep(1000);

    // Upload file to assistant
    const file = await assistant.uploadFile({
      path: tempFileName,
      metadata: { key: 'valueOne', keyTwo: 'valueTwo' },
    });

    // Wait for file to be ready
    await waitUntilAssistantFileReady(assistantName, file.id);

    // Delete temporary file from local filesystem
    try {
      fs.unlinkSync(tempFileName);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }

    return {
      assistantName,
      testFilePath: file.id || '',
    };
  }

  async cleanup(): Promise<void> {
    if (!this.fixtures) {
      return;
    }

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn('No API key available for cleanup');
      return;
    }

    const pinecone = new Pinecone({ apiKey });

    try {
      await pinecone.deleteIndex(this.fixtures.serverlessIndex.name);
    } catch (error) {
      console.error('Failed to delete index:', error);
    }

    try {
      await pinecone.deleteAssistant(this.fixtures.assistant.name);
    } catch (error) {
      console.error('Failed to delete assistant:', error);
    }
  }
}
