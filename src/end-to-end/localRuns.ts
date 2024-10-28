class EndToEndEdgeTest {
  constructor(public readonly apiKey: string) {
    this.apiKey = apiKey;
  }
  url = 'https://ts-client-e2e-tests.vercel.app/api/createSeedQuery';

  hitEndpoint = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinecone_api_key: this.apiKey,
      },
    });

    if (!response || response.status !== 200) {
      throw new Error(`Failed to hit endpoint: ${response.status}`);
    }

    return response.json();
  };

  assertOnResponse = async () => {
    const queryResponse = await this.hitEndpoint(this.url);
    if (!(queryResponse['queryResult']['matches'].length >= 1)) {
      throw new Error(
        `Test failure, query response is empty: ${queryResponse}`
      );
    } else {
      return queryResponse['indexName'];
    }
  };
}

const apiKey = process.argv[2];

if (!apiKey) {
  throw new Error('PINECONE_API_KEY key is required');
}

const edgeTest = new EndToEndEdgeTest(apiKey);

edgeTest
  .assertOnResponse()
  .then((indexName) => {
    console.log(indexName);
  })
  .catch((error) => {
    console.error('Test failed:', error);
  });
