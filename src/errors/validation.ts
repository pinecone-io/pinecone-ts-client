import { BasePineconeError } from './base';

/**
 * This error is thrown when arguments passed to a Pinecone
 * client method fail a runtime validation.
 */
export class PineconeArgumentError extends BasePineconeError {
  constructor(message: string) {
    super(`${message}`);
    this.name = 'PineconeArgumentError';
  }
}
