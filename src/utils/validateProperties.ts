import { PineconeArgumentError } from '../errors';

export function ValidateProperties(item: any, validProperties: string[]) {
  const itemKeys = Object.keys(item);
  // Check for any keys in `item` that are not in `validProperties`
  const invalidKeys = itemKeys.filter((key) => !validProperties.includes(key));
  if (invalidKeys.length > 0) {
    throw new PineconeArgumentError(
      `Object contained invalid properties: ${invalidKeys.join(
        ', '
      )}. Valid properties include ${validProperties.join(', ')}.`
    );
  }
}
