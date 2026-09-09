import { BasePineconeError } from './base';
import { formatDeriveFailure } from '../control/indexes/legacyAccessors';
import type {
  DeriveFailure,
  DeriveFailureReason,
} from '../control/indexes/legacyAccessors';
/** A legacy index property cannot be derived from the API response. */
export class PineconeIndexPropertyError extends BasePineconeError {
  /** The unavailable property. */
  readonly property: string;
  /** A stable reason code independent of message wording. */
  readonly reason: DeriveFailureReason;
  /** The affected index. */
  readonly indexName: string;
  constructor(failure: DeriveFailure) {
    super(formatDeriveFailure(failure));
    this.property = failure.detail.property;
    this.reason = failure.reason;
    this.indexName = failure.detail.indexName;
  }
}
