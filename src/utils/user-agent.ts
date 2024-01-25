import { isEdge } from './environment';
import type { PineconeConfiguration } from '../data/types';
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

  if (config.integrationId) {
    userAgentParts.push(`integrationId=${config.integrationId}`);
  }

  return userAgentParts.join('; ');
};
