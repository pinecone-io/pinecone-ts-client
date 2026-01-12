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

  if (config.callerModelProvider) {
    userAgentParts.push(
      `caller_model_provider=${normalizeCallerInfo(config.callerModelProvider)}`
    );
  }

  if (config.callerModel) {
    userAgentParts.push(`caller_model=${normalizeCallerInfo(config.callerModel)}`);
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

const normalizeCallerInfo = (info: string) => {
  if (!info) {
    return;
  }

  /**
   * normalize caller information
   * 1. Lowercase
   * 2. Limit charset to [a-z0-9_.-]
   * 3. Trim left/right spaces
   * 4. Condense multiple spaces to one, and replace with underscore
   */
  return info
    .toLowerCase()
    .replace(/[^a-z0-9_.\- ]/g, '')
    .trim()
    .replace(/[ ]+/g, '_');
};
