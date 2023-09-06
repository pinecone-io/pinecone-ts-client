import { BasePineconeError } from './base';

export class PineconeBatchUpsertError extends BasePineconeError {
  constructor(
    successCount: number,
    failureCount: number,
    failures: Array<string>
  ) {
    const maxErrors = 3;
    if (failures.length > maxErrors) {
      failures = failures.slice(0, maxErrors);
      failures.push(`...and ${failureCount - maxErrors} other errors`);
    }
    super(
      `${failureCount} out of ${
        failureCount + successCount
      } upserts failed. \n\t${failures.join('\n\t')}`
    );
    this.name = 'PineconeBatchUpsertError';
  }
}
