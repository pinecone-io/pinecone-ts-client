import { Pinecone } from '../../pinecone';
import type { AlignmentResponse } from '../../pinecone-generated-ts-fetch/assistant_evaluation';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('evaluate happy path', () => {
  test('evaluate with valid question, answer, and groundTruth', async () => {
    const result: AlignmentResponse = await pinecone.evaluate({
      question: 'What is the capital of France?',
      answer: 'The capital of France is Paris.',
      groundTruth: 'Paris is the capital and most populous city of France.',
    });

    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.alignment).toBeDefined();
    expect(typeof result.metrics?.alignment).toBe('number');
    expect(result.metrics?.alignment).toBeGreaterThanOrEqual(0);
    expect(result.metrics?.alignment).toBeLessThanOrEqual(1);

    // Check optional fields that may or may not be present
    if (result.reasoning) {
      expect(result.reasoning).toBeDefined();
      if (result.reasoning.evaluatedFacts) {
        expect(Array.isArray(result.reasoning.evaluatedFacts)).toBe(true);
      }
    }

    if (result.usage) {
      expect(result.usage).toBeDefined();
      expect(typeof result.usage.totalTokens).toBe('number');
    }
  });

  test('evaluate with correct answer has high alignment', async () => {
    const result: AlignmentResponse = await pinecone.evaluate({
      question: 'What is 2 + 2?',
      answer: '4',
      groundTruth: 'The answer is 4.',
    });

    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.alignment).toBeDefined();
    // Should have high alignment since the answer matches
    expect(result.metrics?.alignment).toBeGreaterThan(0.7);
  });

  test('evaluate with incorrect answer has low alignment', async () => {
    const result: AlignmentResponse = await pinecone.evaluate({
      question: 'What is the capital of France?',
      answer: 'The capital of France is London.',
      groundTruth: 'Paris is the capital and most populous city of France.',
    });

    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.alignment).toBeDefined();
    // Should have low alignment since the answer is incorrect
    expect(result.metrics?.alignment).toBeLessThan(0.5);
  });
});

describe('evaluate error paths', () => {
  test('evaluate with empty question', async () => {
    await expect(
      pinecone.evaluate({
        question: '',
        answer: 'Paris',
        groundTruth: 'Paris is the capital of France.',
      }),
    ).rejects.toThrow(
      'Invalid input. Question, answer, and groundTruth must be non-empty strings.',
    );
  });

  test('evaluate with empty answer', async () => {
    await expect(
      pinecone.evaluate({
        question: 'What is the capital of France?',
        answer: '',
        groundTruth: 'Paris is the capital of France.',
      }),
    ).rejects.toThrow(
      'Invalid input. Question, answer, and groundTruth must be non-empty strings.',
    );
  });

  test('evaluate with empty groundTruth', async () => {
    await expect(
      pinecone.evaluate({
        question: 'What is the capital of France?',
        answer: 'Paris',
        groundTruth: '',
      }),
    ).rejects.toThrow(
      'Invalid input. Question, answer, and groundTruth must be non-empty strings.',
    );
  });
});
