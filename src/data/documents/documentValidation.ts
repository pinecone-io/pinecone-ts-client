import { PineconeArgumentError } from '../../errors';

/**
 * Rejects an array argument that is present but empty.
 *
 * The document request models grant "empty means no change, so it is ignored"
 * only to `set_fields` and `remove_fields`. Every other array argument counts
 * as specified once it is present, so an empty one is a caller mistake rather
 * than an absent argument.
 */
export const assertNonEmptyArray = (
  values: Array<unknown> | undefined,
  argumentName: string,
  entryDescription: string,
  methodName: string,
): void => {
  if (values !== undefined && values.length === 0) {
    throw new PineconeArgumentError(
      `\`${argumentName}\` must contain at least one ${entryDescription} in ${methodName}.`,
    );
  }
};
