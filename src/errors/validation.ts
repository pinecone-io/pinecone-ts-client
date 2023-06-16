import { BasePineconeError } from './base';

export class PineconeArgumentError extends BasePineconeError {
  constructor(message: string) {
    super(`${message}`);
    this.name = 'PineconeArgumentError';
  }
}
