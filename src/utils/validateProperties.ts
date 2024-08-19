import { PineconeArgumentError } from '../errors';
import {
  ConfigureIndexRequest,
  CreateCollectionRequest,
} from '../pinecone-generated-ts-fetch/control';

// Types and consts for property validation of generated Interfaces to ensure no unknown/invalid properties are passed, no req'd properties are missing
type CreateCollectionRequestType = keyof CreateCollectionRequest;
export const CreateCollectionRequestProperties: CreateCollectionRequestType[] =
  ['source', 'name'];

type ConfigureIndexRequestType = keyof ConfigureIndexRequest;
export const ConfigureIndexRequestProperties: ConfigureIndexRequestType[] = [
  'deletionProtection',
  'spec',
];

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
