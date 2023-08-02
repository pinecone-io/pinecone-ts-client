import { BasePineconeError } from './base';

export class PineconeConnectionError extends BasePineconeError {
  constructor() {
    super(
      'Request failed to reach the server. Are you sure you are targeting an index that exists?'
    );
    this.name = 'PineconeConnectionError';
  }
}
