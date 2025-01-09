import { Pinecone } from '../../pinecone';

describe('evaluate', () => {
  const pc = new Pinecone();
  const assistant = pc.assistant;

  test('Evaluate happy path', async () => {
    const response = await pc.assistant.evaluate({
      question: "What's the capital of France?",
      answer: "Paris is France's capital city",
      groundTruth: 'Paris is the capital city of France',
    });

    expect(response).toBeDefined();
    expect(response.metrics).toBeDefined();
    expect(response.metrics['correctness']).toBeDefined();
    expect(response.metrics['completeness']).toBeDefined();
    expect(response.metrics['alignment']).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage['promptTokens']).toBeDefined();
    expect(response.usage['completionTokens']).toBeDefined();
    expect(response.usage['totalTokens']).toBeDefined();
    expect(response.reasoning).toBeDefined();
    expect(response.reasoning['evaluatedFacts']).toBeDefined();
  });

  test('Evaluate with wrong answer', async () => {
    const response = await assistant.evaluate({
      question: "What's the capital of France?",
      answer: "Lyon is France's capital city",
      groundTruth: 'Paris is the capital city of France',
    });

    expect(response).toBeDefined();
    expect(response.metrics['correctness']).toEqual(0); // B/c answer is wrong
    expect(response.metrics['completeness']).toEqual(0);
    expect(response.metrics['alignment']).toEqual(0);
  });
});
