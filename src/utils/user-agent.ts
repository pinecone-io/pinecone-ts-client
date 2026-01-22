import { isEdge } from './environment';
import type { PineconeConfiguration } from '../data';
import * as packageInfo from '../version.json';

export const buildUserAgent = (config: PineconeConfiguration) => {
  // We always want to include the package name and version
  // along with the langauge name to help distinguish these
  // requests from those emitted by other clients
  const userAgentParts = [
    `${packageInfo.name} v${packageInfo.version}`,
    'lang=typescript',
  ];

  if (isEdge()) {
    userAgentParts.push('Edge Runtime');
  }

  // If available, capture information about the Node.js version
  if (typeof process !== 'undefined' && process && process.version) {
    userAgentParts.push(`node ${process.version}`);
  }

  if (config.sourceTag) {
    userAgentParts.push(`source_tag=${normalizeSourceTag(config.sourceTag)}`);
  }

  if (config.caller) {
    const callerString = formatCaller(config.caller);
    if (callerString) {
      userAgentParts.push(`caller=${callerString}`);
    }
  }

  return userAgentParts.join('; ');
};

const normalizeSourceTag = (sourceTag: string) => {
  if (!sourceTag) {
    return;
  }

  /**
   * normalize sourceTag
   * 1. Lowercase
   * 2. Limit charset to [a-z0-9_ :]
   * 3. Trim left/right spaces
   * 4. Condense multiple spaces to one, and replace with underscore
   */
  return sourceTag
    .toLowerCase()
    .replace(/[^a-z0-9_ :]/g, '')
    .trim()
    .replace(/[ ]+/g, '_');
};

const formatCaller = (caller: {
  provider?: string;
  model: string;
}): string | undefined => {
  if (!caller.model) {
    return;
  }

  const normalizedModel = normalizeCallerString(caller.model);
  if (!normalizedModel) {
    return;
  }

  if (caller.provider) {
    const normalizedProvider = normalizeCallerString(caller.provider);
    if (normalizedProvider) {
      return `${normalizedProvider}:${normalizedModel}`;
    }
  }

  return normalizedModel;
};

const normalizeCallerString = (str: string): string | undefined => {
  if (!str) {
    return;
  }

  /**
   * normalize caller string
   * 1. Lowercase
   * 2. Replace colons with underscores (colons are used as the delimiter between provider and model)
   * 3. Limit charset to [a-z0-9_ \-.] (allowing hyphens, periods, and spaces)
   * 4. Trim left/right spaces
   * 5. Condense multiple spaces to one, and replace with underscore
   */
  return str
    .toLowerCase()
    .replace(/:/g, '_')
    .replace(/[^a-z0-9_ \-.]/g, '')
    .trim()
    .replace(/[ ]+/g, '_');
};
