import { Pinecone } from '../../pinecone';

describe('Integration Test: Pinecone Inference API rerank endpoint', () => {
  let model: string;
  let query: string;
  let documents: Array<string>;
  let decayDocs: Array<{ text: string; timestamp: string }>;
  let decayQuery: string;
  let pinecone: Pinecone;

  beforeAll(() => {
    query = 'What are some good Turkey dishes for Thanksgiving?';
    documents = [
      'document content 1 yay I am about turkey',
      'document content 2',
    ];
    decayDocs = [
      { text: "This is today's doc", timestamp: '2024-09-30 13:02:00' },
      {
        text: "This is today's doc, but at an earlier timestamp",
        timestamp: '2024-09-30 11:02:00',
      },
      {
        text: "This is yesterday's document",
        timestamp: '2024-09-29 11:02:00',
      },
      {
        text: "Now, this is two days' ago's document",
        timestamp: '2024-09-28 11:02:00',
      },
      { text: 'This is a super old doc', timestamp: '2020-01-01 11:02:00' },
    ];
    decayQuery = 'what was yesterday like?';
    model = 'bge-reranker-v2-m3';
    const apiKey = process.env.PINECONE_API_KEY || '';
    pinecone = new Pinecone({ apiKey });
  });

  test('Confirm high-level response structure', async () => {
    const response = await pinecone.inference.rerank(model, query, documents);
    expect(response.model).toEqual(model);
    expect(response.data).toBeDefined();
    expect(response.usage).toBeDefined();
  });

  test('Confirm lower-level response structure', async () => {
    const response = await pinecone.inference.rerank(model, query, documents);
    expect(response.data.length).toBe(documents.length);
    expect(response.data.map((doc) => doc.index)).toBeDefined();
    expect(response.data.map((doc) => doc.score)).toBeDefined();
    expect(response.data.map((doc) => doc.document)).toBeDefined();
    // @ts-ignore
    // (Just ignoring the fact that technically doc.document['text'] could be undefined)
    expect(response.data.map((doc) => doc.document['text'])).toBeDefined();
  });

  test('Additive recency decay, confirm default expectations', async () => {
    const rerankOptions = {
      decay: true,
    };
    const nonDecayedResponse = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs
    );
    const rankOrderOfNonDecayedResponse = nonDecayedResponse.data.map(
      (doc) => doc.index
    );

    const decayedResponse = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs,
      rerankOptions
    );
    const rankOrderOfDecayedResponse = decayedResponse.data.map(
      (doc) => doc.index
    );

    if (
      nonDecayedResponse.data[0].document &&
      decayedResponse.data[0].document
    ) {
      // Non-decayed response should put doc whose text is "This is yesterday's document" in position 0, since query is
      // "what was yesterday like?"
      expect(nonDecayedResponse.data[0].document.text).toContain(
        decayDocs[2].text
      );
      // Decayed response should put doc whose text is "This is today's doc" in position 0, since it's the most
      // recent doc, and we want to rank by recency first and foremost
      expect(decayedResponse.data[0].document.text).toContain(
        decayDocs[0].text
      );
    }

    // General assertion that the rank order of the non-decayed response is different from the rank order of the decayed
    expect(rankOrderOfNonDecayedResponse).not.toEqual(
      rankOrderOfDecayedResponse
    );
  });

  test('Additive recency decay, super small decayWeight', async () => {
    // This test should yield a rank order extremely similar to the rank order of a non-decayed response
    const rerankOptionsSmallDecay = {
      decay: true,
      decayWeight: 0.000000001,
    };
    const responseNoDecay = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs
    );
    const responseSmallDecay = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs,
      rerankOptionsSmallDecay
    );
    const responseDefaultDecay = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs,
      { decay: true }
    );

    expect(responseNoDecay.data.map((doc) => doc.index)).toEqual(
      responseSmallDecay.data.map((doc) => doc.index)
    );
    expect(responseSmallDecay.data.map((doc) => doc.index)).not.toEqual(
      responseDefaultDecay.data.map((doc) => doc.index)
    );
  });

  test('Additive recency decay, super small decayThreshold', async () => {
    // With a super small decayThreshold, we expect only docs whose timestamps fall into the threshold of now-0.25
    // days to get a decay added to them; since no docs in `decayDocs` meet this expectation, we expect the rank
    // order to be the same as if no decay were applied
    const rerankOptionsSmallThreshold = {
      decay: true,
      decayThreshold: 0.25, // 1/4 day
    };
    const responseNoDecay = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs
    );
    const responseHighThreshold = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs,
      rerankOptionsSmallThreshold
    );

    expect(responseNoDecay.data.map((doc) => doc.index)).toEqual(
      responseHighThreshold.data.map((doc) => doc.index)
    );
  });

  test('Additive recency decay, large decayThreshold', async () => {
    // With a large decayThreshold, we expect all docs to get a decay added to them, and this decay will be gradual.
    // Since decay is applied uniformally across all docs, their rank order is the same as if no decay had been applied,
    // but their scores will be lower.
    const rerankOptionsLargeThreshold = {
      decay: true,
      decayThreshold: 300, // 1 year
    };
    const responseNoDecay = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs
    );
    const responseLargeThreshold = await pinecone.inference.rerank(
      model,
      decayQuery,
      decayDocs,
      rerankOptionsLargeThreshold
    );

    let noDecaySum: number = 0;
    responseNoDecay.data.forEach((a) => (noDecaySum += a.score));

    let largeThresholdSum: number = 0;
    responseLargeThreshold.data.forEach((a) => (largeThresholdSum += a.score));

    expect(noDecaySum).toBeGreaterThan(largeThresholdSum);
  });
});
