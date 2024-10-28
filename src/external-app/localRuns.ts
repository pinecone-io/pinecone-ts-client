class EdgeExternalAppTest {
  url: string;
  constructor(public readonly apiKey: string, url: string) {
    this.apiKey = apiKey;
    this.url = url;
  }

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

const apiKey = process.env['PINECONE_API_KEY'];
if (!apiKey) {
  throw new Error('PINECONE_API_KEY key is required');
}

const url = process.argv[2]; // Get local URL from the command line arg

const { assertOnResponse } = new EdgeExternalAppTest(apiKey, url);

assertOnResponse().then((indexName) => {
  console.log(indexName);
});
