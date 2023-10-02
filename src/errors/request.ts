import { BasePineconeError } from './base';

/**
 * This error is thrown when the client attempts to make a
 * request and never receives any response.
 *
 * This could be due to:
 * - Incorrect configuration of the client. The client builds its connection url using values supplied in configuration, so if these values are incorrect the request will not reach a Pinecone server.
 * - An outage of Pinecone's APIs. See [Pinecone's status page](https://status.pinecone.io/) to find out whether there is an ongoing incident.
 *
 * @see [Pinecone's status page](https://status.pinecone.io/)
 * */
export class PineconeConnectionError extends BasePineconeError {
  constructor() {
    super(
      'Request failed to reach Pinecone. Verify you have the correct environment, project id, and index name configured.'
    );
    this.name = 'PineconeConnectionError';
  }
}
