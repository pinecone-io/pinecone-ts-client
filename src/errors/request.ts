import { BasePineconeError } from "./base";

export class PineconeConnectionError extends BasePineconeError {
    constructor(message: string) {
      super(message);
      this.name = 'PineconeConnectionError';
    }
  }