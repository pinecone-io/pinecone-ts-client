import { BasePineconeError } from './base';

export class PineconeConnectionError extends BasePineconeError {
  constructor() {
    super(
      'Request failed to reach Pinecone. Verify you have the correct environment, project id, and index name configured.'
    );
    this.name = 'PineconeConnectionError';
  }
}
